const mongoose = require('mongoose');


/**
 * Occurrence Schema
 *
 * The occurrenceSchema defines the structure for storing individual occurrences
 * related to an issue. Each occurrence is linked to a user and has an optional
 * description, along with timestamps for creation and updates.
 */
const occurrenceSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
});


/**
 * Attachment Schema
 *
 * The attachmentSchema defines the structure for storing file attachments
 * related to an issue. Each attachment is linked to a user and contains the
 * file path and a creation timestamp.
 */
const attachmentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  file_path: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled',
  },
  created_at: {
    type: Date,
    default: Date.now
  },
});


/**
 * Comment Schema
 *
 * The commentSchema defines the structure for storing comments related to an
 * issue. Each comment is linked to a user, contains the comment text, and has
 * a creation timestamp.
 */
const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    required: true,
  }, 
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment_text: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now
  },
});


/**
 * Issue Schema
 *
 * The issueSchema defines the structure for storing issue data in the database.
 * Each issue is associated with a project, a reporter, and has a status, title,
 * and optional descriptions, among other fields. The schema also embeds related
 * occurrences, attachments, and comments as subdocuments.
 */
const issueSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  reporter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status_history: {
    type: [{
      status_id: {
        type: Number,
        ref: 'Status',
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      }
    }],
    default: [{
      status_id: 2,
      date: Date.now,
    }]
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  charm: {
    type: String,
    required: true,
    maxlength: 15,
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  occurrences: [occurrenceSchema], // Embedded occurrences subdocuments
  attachments: [attachmentSchema], // Embedded attachments subdocuments
  comments: [commentSchema], // Embedded comments subdocuments
});

// Virtual property to get the current status of the issue (last status in history)
issueSchema.virtual('status_id').get(function () { // current_status is likely a better name, but I'm deciding to keep it as status_id for compatibility (i.e. I'm lazy)
  if (this.status_history.length > 0) {
    return this.status_history[this.status_history.length - 1];
  }
  return null;
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
