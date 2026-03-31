const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Anonymous - no student reference stored
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  academicYear: { type: String },
  // Ratings (1-5)
  ratings: {
    teachingQuality: { type: Number, min: 1, max: 5, required: true },
    subjectKnowledge: { type: Number, min: 1, max: 5, required: true },
    punctuality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    helpfulness: { type: Number, min: 1, max: 5 }
  },
  comments: { type: String, maxlength: 500 },
  isAnonymous: { type: Boolean, default: true },
  // Store hashed student ID to prevent multiple submissions without revealing identity
  studentHash: { type: String, required: true, select: false }
}, { timestamps: true });

feedbackSchema.index({ teacher: 1, academicYear: 1 });
// Prevent duplicate feedback per student per teacher per year
feedbackSchema.index({ studentHash: 1, teacher: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
