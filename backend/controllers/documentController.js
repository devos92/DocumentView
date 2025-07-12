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

// s3 client configuration
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
    key: function (req, file, cb) {
      const key = `documents/${Date.now().toString()}-${file.originalname}`;
      cb(null, key);
    },
  }),
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const { title, description } = req.body;
    const file = req.file;

    if (!file || !title) {
      return res.status(400).json({ message: 'Title and file required' });
    }

    const doc = await Document.create({
      title,
      description,
      s3Key: file.key,
      uploadedBy: req.user.id,
    });

    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get signed URL for a document
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: doc.s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.json({ ...doc.toObject(), signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve document' });
  }
});

module.exports = router;
