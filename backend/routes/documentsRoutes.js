const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
} = require('../controllers/documentsController');
const authenticaeToken = require('../middleware/authenticateToken');

router.post('/upload', authenticaeToken, uploadDocument);

module.exports = router;
