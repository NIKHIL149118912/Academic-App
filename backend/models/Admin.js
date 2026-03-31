/**
 * Admin Model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true, default: '' },
  adminId: { type: String, required: true, unique: true, uppercase: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, default: 'admin', immutable: true },
  permissions: {
    manageStudents: { type: Boolean, default: true },
    manageTeachers: { type: Boolean, default: true },
    manageAttendance: { type: Boolean, default: true },
    manageMarks: { type: Boolean, default: true },
    manageNotices: { type: Boolean, default: true },
    manageFees: { type: Boolean, default: true },
    viewFeedback: { type: Boolean, default: true },
    manageTimetable: { type: Boolean, default: true }
  },
  // Academic policies
  academicPolicies: {
    feedbackEnabled: { type: Boolean, default: true },
    attendanceThreshold: { type: Number, default: 75 }, // percentage
    marksDeadline: Date,
    examSchedulePublished: { type: Boolean, default: false }
  },
  isSuperAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  lastLogin: Date,
  profileImage: { type: String, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

adminSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
