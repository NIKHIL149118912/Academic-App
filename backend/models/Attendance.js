/**
 * Attendance Model
 * Tracks daily subject-wise attendance
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: { type: String, required: true, trim: true },
  subjectCode: { type: String, trim: true },
  isLab: { type: Boolean, default: false },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  // Class info
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  // Audit
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'markedByModel',
    required: true
  },
  markedByModel: {
    type: String,
    enum: ['Teacher', 'Admin'],
    required: true
  },
  isEdited: { type: Boolean, default: false },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  editedAt: Date,
  remarks: { type: String, trim: true }
}, {
  timestamps: true
});

// Prevent duplicate attendance entry
attendanceSchema.index(
  { student: 1, subject: 1, date: 1 },
  { unique: true }
);

// Efficient query indexes
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ branch: 1, year: 1, section: 1, date: -1 });
attendanceSchema.index({ subject: 1, date: -1 });
attendanceSchema.index({ markedBy: 1 });

/**
 * Static: Get attendance summary for a student
 */
attendanceSchema.statics.getAttendanceSummary = async function (studentId, filters = {}) {
  const match = { student: new mongoose.Types.ObjectId(studentId), ...filters };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$subject',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
      }
    },
    {
      $project: {
        subject: '$_id',
        total: 1,
        present: 1,
        absent: 1,
        late: 1,
        percentage: {
          $round: [
            { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
