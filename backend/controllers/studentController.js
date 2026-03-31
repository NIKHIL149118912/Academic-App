/**
 * Student Controller
 * Handles student-specific operations
 */

const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');

// ─── Get All Students (Admin/Teacher) ─────────────────────────────────────────
const getAllStudents = async (req, res) => {
  const { branch, year, section, isActive, page = 1, limit = 20, search, sortBy = 'rollNumber', order = 'asc' } = req.query;

  const query = {};
  if (branch) query.branch = branch;
  if (year) query.year = parseInt(year);
  if (section) query.section = section;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [students, total] = await Promise.all([
    Student.find(query)
      .select('-password -refreshToken')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Student.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: students,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
  });
};

// ─── Get Student by ID ────────────────────────────────────────────────────────
const getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id).select('-password -refreshToken');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  res.json({ success: true, data: student });
};

// ─── Update Student (Admin) ───────────────────────────────────────────────────
const updateStudent = async (req, res) => {
  const disallowed = ['password', 'refreshToken', 'role'];
  disallowed.forEach(field => delete req.body[field]);

  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password -refreshToken');

  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  res.json({ success: true, data: student, message: 'Student updated successfully.' });
};

// ─── Delete Student (Admin) ───────────────────────────────────────────────────
const deleteStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  // Soft delete
  student.isActive = false;
  await student.save();

  res.json({ success: true, message: 'Student deactivated successfully.' });
};

// ─── Student Dashboard Stats ──────────────────────────────────────────────────
const getStudentDashboard = async (req, res) => {
  const studentId = req.user._id;
  const student = req.user;

  const [attendanceSummary, recentMarks, totalAssignments] = await Promise.all([
    Attendance.getAttendanceSummary(studentId),
    Marks.find({ student: studentId }).sort({ createdAt: -1 }).limit(5),
    require('../models/Assignment').countDocuments({
      branch: student.branch,
      year: student.year,
      section: student.section,
      isActive: true
    })
  ]);

  // Calculate overall attendance
  const overall = attendanceSummary.reduce(
    (acc, s) => ({ total: acc.total + s.total, present: acc.present + s.present }),
    { total: 0, present: 0 }
  );
  const overallPercentage = overall.total > 0
    ? Math.round((overall.present / overall.total) * 100 * 100) / 100
    : 0;

  res.json({
    success: true,
    data: {
      student: req.user,
      stats: {
        overallAttendance: overallPercentage,
        subjectsTracked: attendanceSummary.length,
        recentMarks,
        totalAssignments
      },
      attendanceSummary
    }
  });
};

// ─── Update Profile (Student self) ───────────────────────────────────────────
const updateProfile = async (req, res) => {
  const allowed = ['phone', 'address', 'dateOfBirth'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

  if (req.file) updates.profileImage = `/uploads/profiles/${req.file.filename}`;

  const student = await Student.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true
  }).select('-password -refreshToken');

  res.json({ success: true, data: student, message: 'Profile updated.' });
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const student = await Student.findById(req.user._id).select('+password');
  if (!await student.comparePassword(currentPassword)) {
    return res.status(400).json({ success: false, message: 'Current password incorrect.' });
  }

  student.password = newPassword;
  await student.save();

  res.json({ success: true, message: 'Password changed successfully.' });
};

module.exports = {
  getAllStudents, getStudentById, updateStudent, deleteStudent,
  getStudentDashboard, updateProfile, changePassword
};
