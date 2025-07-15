require('dotenv').config();
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const authenticateToken = require('../middleware/authenticateToken');
const Document = require('../models/Document');
const router = express.Router();

// AWS S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

//Multer-S3 setup for streaming uploads to S3
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

/**
 * POST /api/documents
 * Create a new document metadata record
 */
router.post('/', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const newDoc = await Document.create({
      title,
      created_at: new Date(),
      attachments: [],
    });
    res.status(201).json(newDoc);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/documents
 * List all documents (title + creation date)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const docs = await Document.find({}, 'title created_at');
    res.json(docs);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/documents/:documentId
 * Fetch one document along with its attachments' signed URLs
 */
router.get('/:documentId', authenticateToken, async (req, res) => {
  const { documentId } = req.params;
  try {
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const attachments = await Promise.all(
      doc.attachments.map(async (att) => {
        const key = att.file_path.replace(/^\/+/, '');
        const url = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
          }),
          { expiresIn: 3600 }
        );
        return { ...att.toObject(), signedUrl: url };
      })
    );

    res.json({ ...doc.toObject(), attachments });
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/documents/:documentId/attachments
 * Upload up to 5 files into S3 and attach metadata
 */
router.post(
  '/:documentId/attachments',
  authenticateToken,
  upload.array('file', 5),
  async (req, res) => {
    const { documentId } = req.params;
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      const newAtts = files.map((file) => ({
        user_id: req.user.id,
        file_path: file.key,
        title: file.originalname,
        created_at: new Date(),
      }));

      doc.attachments.push(...newAtts);
      await doc.save();

      const attachments = await Promise.all(
        newAtts.map(async (att) => {
          const key = att.file_path.replace(/^\/+/, '');
          const url = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: key,
            }),
            { expiresIn: 3600 }
          );
          return { ...att, signedUrl: url };
        })
      );

      res.json(attachments);
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

/**
 * DELETE /api/documents/:documentId/attachments/:attachmentId
 * Remove an attachment both from S3 and the document record
 */
router.delete(
  '/:documentId/attachments/:attachmentId',
  authenticateToken,
  async (req, res) => {
    const { documentId, attachmentId } = req.params;
    try {
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      const idx = doc.attachments.findIndex(
        (att) => att._id.toString() === attachmentId
      );
      if (idx === -1)
        return res.status(404).json({ message: 'Attachment not found' });

      const att = doc.attachments[idx];
      if (req.user.role !== 'admin' && req.user.id !== att.user_id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: att.file_path.replace(/^\/+/, ''),
        })
      );
      doc.attachments.splice(idx, 1);
      await doc.save();

      res.json({ message: 'Attachment deleted' });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

module.exports = router;
