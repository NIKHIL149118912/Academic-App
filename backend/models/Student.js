/**
 * Student Model
 * Comprehensive schema with indexes for performance
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  // Identity
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    default: ''
  },
  // Academic Info
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be between 1 and 6'],
    max: [6, 'Year must be between 1 and 6']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true,
    enum: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'Other']
  },
  semester: {
    type: Number,
    min: 1,
    max: 12
  },
  // Contact
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    trim: true
  },
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    default: 'student',
    immutable: true
  },
  // Profile
  profileImage: {
    type: String,
    default: null
  },
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Tokens
  refreshToken: {
    type: String,
    select: false
  },
  // Audit
  lastLogin: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Indexes for performance ───────────────────────────────────────────────────
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ branch: 1, year: 1, section: 1 });
studentSchema.index({ isActive: 1 });

// ─── Virtual: Full Name ────────────────────────────────────────────────────────
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// ─── Pre-save: Hash Password ───────────────────────────────────────────────────
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Method: Compare Password ──────────────────────────────────────────────────
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Public Profile ────────────────────────────────────────────────────
studentSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('Student', studentSchema);
