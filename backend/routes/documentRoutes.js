require('dotenv').config();
const multer = require('multer');
const pdf = require('pdf-parse');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);
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

/**  AWS S3 Client Configuration */
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const key = `documents/${Date.now()}-${file.originalname}`;
      cb(null, key);
    },
  }),
});

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** create metadata */

router.post('/', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const newDoc = new Document({
      title,
      created_at: new Date(),
      attachments: [],
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post(
  '/:documentId',
  authenticateToken,
  upload.array('file', 5),
  async (req, res) => {
    const { documentId } = req.params;
    const files = req.files;

    if (!files.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const newAttachments = files.map((f) => ({
      user_id: req.user.id,
      file_path: f.key,
      title: f.originalname,
      created_at: new Date(),
    }));
    doc.attachments.push(...newAttachments);

    let fullText = doc.fullText || '';
    await Promise.all(
      files.map(async (f) => {
        if (!f.mimetype.includes('pdf')) return;
        // fetch back from S3
        const get = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: f.key,
        });
        const s3obj = await s3Client.send(get);
        const buffer = await streamToBuffer(s3obj.Body);
        // parse text
        const { text } = await pdf(buffer);
        fullText += '\n\n' + text;
      })
    );
    doc.fullText = fullText;

    await doc.save();

    const attachmentsWithSignedUrls = await Promise.all(
      newAttachments.map(async (a) => {
        const cmd = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: a.file_path,
        });
        const url = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
        return { ...a, signedUrl: url };
      })
    );
    res.json(attachmentsWithSignedUrls);
  }
);

/**  Delete Attachment */
router.delete(
  '/:documentId/:attachmentId',
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

router.get('/search', authenticateToken, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  try {
    const docs = await Document.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' }, title: 1, created_at: 1 }
    ).sort({ score: { $meta: 'textScore' } });

    res.json(docs);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const docs = await Document.find({}, 'title created_at');
    return res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
});

/**  Get Signed URLs for Viewing */
router.get('/:documentId/signedUrls', authenticateToken, async (req, res) => {
  const document = await Document.findById(req.params.documentId);
  // … your 404 check …

  const attachmentsWithSignedUrls = await Promise.all(
    document.attachments.map(async (attachment) => {
      const key = trimStart(attachment.file_path, '/');
      const cmd = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,

        // ** Force inline display **
        ResponseContentDisposition: 'inline',

        // ** Optional: explicitly tell S3 it’s a PDF **
        ResponseContentType: 'application/pdf',
      });

      const signedUrl = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
      return { ...attachment.toObject(), signedUrl };
    })
  );

  res.json(attachmentsWithSignedUrls);
});

/** 🛠 Helper to clean key path */
function trimStart(str, charlist = '/') {
  let i = 0;
  while (i < str.length && charlist.includes(str[i])) i++;
  return str.substring(i);
}

module.exports = router;
