require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Document = require('../models/Document');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/** 🔧 AWS S3 Client Configuration */
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/** 🔧 Multer Config for Upload to S3 */
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const key =
        'documents/' + Date.now().toString() + '-' + file.originalname;
      cb(null, key);
    },
  }),
});

/** ✅ Upload Documents */
router.post(
  '/api/documents/:documentId',
  authenticateToken,
  upload.array('file', 5),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const newAttachments = files.map((file) => ({
        user_id: req.user.id,
        file_path: file.key,
        title: file.originalname || 'Untitled',
        created_at: new Date(),
      }));

      document.attachments.push(...newAttachments);
      await document.save();

      const attachmentsWithSignedUrls = await Promise.all(
        newAttachments.map(async (attachment) => {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: trimStart(attachment.file_path, '/'),
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          return { ...attachment, signedUrl };
        })
      );

      res.json(attachmentsWithSignedUrls);
    } catch (error) {
      console.error('Upload error:', error);
      res
        .status(500)
        .json({ error: 'Internal Server Error', details: error.message });
    }
  }
);

/** ❌ Delete Attachment */
router.delete(
  '/api/documents/:documentId/:attachmentId',
  authenticateToken,
  async (req, res) => {
    try {
      const { documentId, attachmentId } = req.params;

      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const attachmentIndex = document.attachments.findIndex(
        (attachment) => attachment._id.toString() === attachmentId
      );

      if (attachmentIndex === -1) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      const attachment = document.attachments[attachmentIndex];

      if (
        req.user.role !== 'admin' &&
        req.user.id !== attachment.user_id.toString()
      ) {
        return res
          .status(403)
          .json({ message: 'Not authorized to delete this attachment' });
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: trimStart(attachment.file_path, '/'),
      });

      await s3Client.send(deleteCommand);

      document.attachments.splice(attachmentIndex, 1);
      await document.save();

      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/** 📄 Get Signed URLs for Viewing */
router.get(
  '/api/documents/:documentId/signedUrls',
  authenticateToken,
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const attachmentsWithSignedUrls = await Promise.all(
        document.attachments.map(async (attachment) => {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: trimStart(attachment.file_path, '/'),
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          return { ...attachment.toObject(), signedUrl };
        })
      );

      res.json(attachmentsWithSignedUrls);
    } catch (error) {
      console.error('Error fetching signed URLs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/** 🛠 Helper to clean key path */
function trimStart(str, charlist = '/') {
  let i = 0;
  while (i < str.length && charlist.includes(str[i])) i++;
  return str.substring(i);
}

module.exports = router;
