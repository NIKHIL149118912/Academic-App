const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNumber: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teacherName: { type: String },
  room: { type: String },
  isLab: { type: Boolean, default: false }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  semester: { type: Number },
  academicYear: { type: String },
  schedule: {
    monday: [periodSchema],
    tuesday: [periodSchema],
    wednesday: [periodSchema],
    thursday: [periodSchema],
    friday: [periodSchema],
    saturday: [periodSchema]
  },
  fileUrl: { type: String }, // Optional uploaded PDF
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
}, { timestamps: true });

timetableSchema.index({ branch: 1, year: 1, section: 1, isActive: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
