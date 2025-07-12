require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Issue = require('../models/Issue');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

/**
 * AWS S3 Configuration
 *
 * Initializes an S3 client with credentials and region from env.
 * This client is used for managing attachments uploaded to the S3 bucket, including retrieving
 * signed URLs and deleting files from the bucket.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Multer S3 Configuration
 *
 * Configures Multer to use S3 as the storage destination for file uploads.
 * Files are stored under the 'attachments/' prefix, with a unique name generated using 
 * the current timestamp and the original file name.
 */
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const key = 'attachments/' + Date.now().toString() + '-' + file.originalname;
      cb(null, key);
    }
  })
});

/**
 * Route to get attachments for an issue with signed URLs
 *
 * Retrieves the attachments for a specific issue, identified by `issueId`, 
 * and generates signed URLs for each attachment, allowing them to be downloaded 
 * securely.
 *
 * @name GET /:issueId
 * @function
 * @memberof module:routes/attachments
 * @param {Object} req.params.issueId - The ID of the issue.
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while retrieving attachments.
 */
router.get("/:issueId", authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const attachmentsWithSignedUrls = await Promise.all(issue.attachments.map(async (attachment) => {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: TrimStart(attachment.file_path, '/'), // Use the stored file_path directly
      });
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return { ...attachment.toObject(), signedUrl };
    }));

    res.json(attachmentsWithSignedUrls);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Route to upload attachments to an issue
 *
 * This route allows authenticated users to upload up to 5 files as attachments to a specific issue,
 * identified by `issueId`. The files are uploaded to S3, and the attachment details (including signed URLs) 
 * are stored in the issue's `attachments` array.
 *
 * @name POST /:issueId
 * @function
 * @memberof module:routes/attachments
 * @param {Object} req.params.issueId - The ID of the issue.
 * @param {Array} req.files - The uploaded files.
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while uploading the files.
 */
router.post("/:issueId", authenticateToken, upload.array('file', 5), async (req, res) => {
  try {
    const { issueId } = req.params;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const newAttachments = files.map(file => ({
      user_id: req.user.id,
      file_path: file.key, // Use file.key for S3 uploads
      title: file.originalname || 'Untitled',
      created_at: new Date()
    }));

    issue.attachments.push(...newAttachments);
    await issue.save();

    const attachmentsWithSignedUrls = await Promise.all(newAttachments.map(async (attachment) => {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: TrimStart(attachment.file_path, '/'),
      });
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return { ...attachment, signedUrl };
    }));

    res.json(attachmentsWithSignedUrls);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * Route to delete an attachment from an issue
 *
 * Deletes a specific attachment from an issue, identified by `issueId` and `attachmentId`.
 * Only the user who uploaded the attachment or an admin can delete it. The file is also removed from S3.
 *
 * @name DELETE /:issueId/:attachmentId
 * @function
 * @memberof module:routes/attachments
 * @param {Object} req.params.issueId - The ID of the issue.
 * @param {Object} req.params.attachmentId - The ID of the attachment to delete.
 * @throws {403} - If the user is not authorized to delete the attachment.
 * @throws {404} - If the issue or attachment is not found.
 * @throws {500} - If an error occurs while deleting the attachment.
 */
router.delete("/:issueId/:attachmentId", authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const attachmentIndex = issue.attachments.findIndex(
      attachment => attachment._id.toString() === req.params.attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const attachment = issue.attachments[attachmentIndex];

    // Check if the user is authorized to delete the attachment
    if (req.user.role !== 'admin' && req.user.id !== attachment.user_id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this attachment' });
    }

    // Delete the file from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: TrimStart(attachment.file_path, '/'), // Use the file_path directly as the Key
    });

    await s3Client.send(deleteCommand);

    // Remove the attachment from the issue
    issue.attachments.splice(attachmentIndex, 1);
    await issue.save();

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Utility function to trim characters from the start of a string
 *
 * This helper function removes any leading characters from the start of a string, 
 * such as slashes or spaces, making sure the string starts cleanly with the desired characters.
 *
 * @param {string} str - The string to trim.
 * @param {string} charlist - The characters to remove from the start of the string.
 * @returns {string} The trimmed string.
 */
function TrimStart(str, charlist) {
  if (charlist === undefined) charlist = "\s";
  let startIndex = 0;
  while (startIndex < str.length && charlist.indexOf(str[startIndex]) >= 0) {
    startIndex++;
  }
  return str.substr(startIndex);
}

/**
 * Route to retrieve signed URLs for attachments
 *
 * This route generates signed URLs for attachments associated with a specific issue,
 * allowing users to download files securely. The issue is identified by `issueId`.
 *
 * @name GET /:issueId/signedUrls
 * @function
 * @memberof module:routes/attachments
 * @param {Object} req.params.issueId - The ID of the issue.
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while generating the signed URLs.
 */
router.get("/:issueId/signedUrls", authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const attachmentsWithSignedUrls = await Promise.all(issue.attachments.map(async (attachment) => {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: TrimStart(attachment.file_path, '/').split('/').pop(), // Assuming file_path contains the full S3 URL
      });
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return { ...attachment.toObject(), signedUrl };
    }));

    res.json(attachmentsWithSignedUrls);
  } catch (error) {
    console.error('Error fetching signed URLs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
