const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  project_name: {
    type: String,
    required: true,
    maxlength: 255,
  },
  description: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status_types: [
    {
      status_name: {
        type: String,
        required: true,
        maxlength: 50,
      },
    },
  ],
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;