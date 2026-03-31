/**
 * Assignment Model
 */

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  fileUrl: { type: String, required: true },
  originalName: { type: String },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  grade: { type: String },
  feedback: { type: String },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  subject: { type: String, required: true, trim: true },
  subjectCode: { type: String },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  deadline: { type: Date, required: true },
  totalMarks: { type: Number, default: 10 },
  attachments: [{ fileUrl: String, originalName: String }],
  submissions: [submissionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

assignmentSchema.index({ branch: 1, year: 1, section: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ deadline: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
