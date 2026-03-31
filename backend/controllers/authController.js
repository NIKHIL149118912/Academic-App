/**
 * Auth Controller
 * Handles registration, login, token refresh, logout for all roles
 */

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwtToken');
const logger = require('../utils/logger');

// ─── Helper: Send token response ─────────────────────────────────────────────
const sendTokenResponse = async (user, model, statusCode, res) => {
  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: user.toPublicProfile()
  });
};

// ─── Student Register ─────────────────────────────────────────────────────────
const registerStudent = async (req, res) => {
  const { firstName, lastName, rollNumber, section, year, branch, email, password } = req.body;

  const existing = await Student.findOne({ $or: [{ email }, { rollNumber }] });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: existing.email === email
        ? 'Email already registered.'
        : 'Roll number already registered.'
    });
  }

  const student = await Student.create({
    firstName, lastName, rollNumber, section, year, branch, email, password
  });

  logger.info(`New student registered: ${rollNumber}`);
  await sendTokenResponse(student, 'Student', 201, res);
};

// ─── Teacher Register ─────────────────────────────────────────────────────────
const registerTeacher = async (req, res) => {
  const { firstName, lastName, teacherId, email, password, department, designation } = req.body;

  const existing = await Teacher.findOne({ $or: [{ email }, { teacherId }] });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: existing.email === email ? 'Email already registered.' : 'Teacher ID already exists.'
    });
  }

  const teacher = await Teacher.create({
    firstName, lastName, teacherId, email, password, department, designation
  });

  logger.info(`New teacher registered: ${teacherId} - pending approval`);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Await admin approval to login.',
    teacher: teacher.toPublicProfile()
  });
};

// ─── Admin Register (restricted) ──────────────────────────────────────────────
const registerAdmin = async (req, res) => {
  const { firstName, lastName, adminId, email, password, superAdminKey } = req.body;

  // Require super admin key for admin creation
  if (superAdminKey !== process.env.SUPER_ADMIN_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid super admin key.' });
  }

  const existing = await Admin.findOne({ $or: [{ email }, { adminId }] });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Admin already exists.' });
  }

  const admin = await Admin.create({ firstName, lastName, adminId, email, password });
  logger.info(`Admin created: ${adminId}`);
  await sendTokenResponse(admin, 'Admin', 201, res);
};

// ─── Universal Login ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Identifier, password, and role are required.'
    });
  }

  let user;

  if (role === 'student') {
    // Students can login with rollNumber OR email
    user = await Student.findOne({
      $or: [
        { rollNumber: identifier.toUpperCase() },
        { email: identifier.toLowerCase() }
      ]
    }).select('+password');
  } else if (role === 'teacher') {
    user = await Teacher.findOne({
      $or: [{ teacherId: identifier.toUpperCase() }, { email: identifier.toLowerCase() }]
    }).select('+password');
  } else if (role === 'admin') {
    user = await Admin.findOne({
      $or: [{ adminId: identifier.toUpperCase() }, { email: identifier.toLowerCase() }]
    }).select('+password');
  } else {
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
  }

  if (role === 'teacher' && !user.isApproved) {
    return res.status(403).json({ success: false, message: 'Account pending admin approval.' });
  }

  logger.info(`Login: ${role} - ${user._id}`);
  await sendTokenResponse(user, role, 200, res);
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token required.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  // Find user and verify stored refresh token
  let user;
  if (decoded.role === 'student') {
    user = await Student.findById(decoded.id).select('+refreshToken');
  } else if (decoded.role === 'teacher') {
    user = await Teacher.findById(decoded.id).select('+refreshToken');
  } else if (decoded.role === 'admin') {
    user = await Admin.findById(decoded.id).select('+refreshToken');
  }

  if (!user || user.refreshToken !== token) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, accessToken, refreshToken: newRefreshToken });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  const user = req.user;
  const role = req.userRole;

  let Model;
  if (role === 'student') Model = Student;
  else if (role === 'teacher') Model = Teacher;
  else Model = Admin;

  await Model.findByIdAndUpdate(user._id, { refreshToken: null });

  logger.info(`Logout: ${role} - ${user._id}`);
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ─── Get Current User ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user, role: req.userRole });
};

module.exports = { registerStudent, registerTeacher, registerAdmin, login, refreshToken, logout, getMe };
