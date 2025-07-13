const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  file_path: String,
  title: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const documentSchema = new mongoose.Schema({
  title: String,
  attachments: [attachmentSchema],
});
module.exports = mongoose.model('Document', documentSchema);
