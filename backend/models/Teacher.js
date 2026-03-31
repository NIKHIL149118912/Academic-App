/**
 * Teacher Model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  phone: { type: String, trim: true },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: { type: String, default: 'teacher', immutable: true },
  department: { type: String, trim: true },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor'],
    default: 'Assistant Professor'
  },
  // Assigned subjects and classes
  assignedSubjects: [{
    subject: { type: String, required: true },
    subjectCode: { type: String },
    branch: { type: String },
    year: { type: Number },
    section: { type: String },
    isLab: { type: Boolean, default: false }
  }],
  qualification: String,
  experience: Number, // years
  profileImage: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false }, // Admin must approve
  refreshToken: { type: String, select: false },
  lastLogin: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ isActive: 1, isApproved: 1 });

teacherSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

teacherSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('Teacher', teacherSchema);
