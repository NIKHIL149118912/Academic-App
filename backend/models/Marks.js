/**
 * Marks Model
 * Handles all exam types: Performance Tests, Sessionals, Pre-University
 */

const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: { type: String, required: true, trim: true },
  subjectCode: { type: String, trim: true },
  examType: {
    type: String,
    required: true,
    enum: ['performance_test', 'sessional_1', 'sessional_2', 'pre_university', 'preboard', 'practical', 'assignment']
  },
  examName: { type: String, trim: true }, // e.g., "PT-1", "Sessional Mid-term"
  marksObtained: { type: Number, required: true, min: 0 },
  totalMarks: { type: Number, required: true, min: 1 },
  // Class info
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  semester: { type: Number },
  academicYear: { type: String }, // e.g., "2024-25"
  examDate: { type: Date },
  // Audit
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'uploadedByModel',
    required: true
  },
  uploadedByModel: {
    type: String,
    enum: ['Teacher', 'Admin'],
    required: true
  },
  isEdited: { type: Boolean, default: false },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  remarks: { type: String, trim: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate marks entry
marksSchema.index(
  { student: 1, subject: 1, examType: 1, examName: 1 },
  { unique: true }
);

marksSchema.index({ student: 1, subject: 1 });
marksSchema.index({ branch: 1, year: 1, section: 1 });

// Virtual: percentage
marksSchema.virtual('percentage').get(function () {
  return Math.round((this.marksObtained / this.totalMarks) * 100 * 100) / 100;
});

// Virtual: grade
marksSchema.virtual('grade').get(function () {
  const pct = (this.marksObtained / this.totalMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
});

module.exports = mongoose.model('Marks', marksSchema);
