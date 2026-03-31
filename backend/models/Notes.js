const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  subjectCode: { type: String },
  topic: { type: String, trim: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String }, // null = all sections
  fileUrl: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  isActive: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 }
}, { timestamps: true });

notesSchema.index({ branch: 1, year: 1, subject: 1 });
notesSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Notes', notesSchema);
