/**
 * Attendance Controller
 */

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { exportAttendanceCSV } = require('../utils/csvExport');
const path = require('path');

// ─── Upload/Mark Attendance (Teacher/Admin) ───────────────────────────────────
const markAttendance = async (req, res) => {
  const { branch, year, section, subject, subjectCode, date, records, isLab } = req.body;
  // records: [{ studentId, status, remarks }]

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, message: 'Attendance records are required.' });
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Teachers cannot edit attendance after the day ends
  if (req.userRole === 'teacher') {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (attendanceDate > today) {
      return res.status(400).json({ success: false, message: 'Cannot mark attendance for future dates.' });
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    // Allow today only
    if (attendanceDate < startOfToday) {
      return res.status(403).json({ success: false, message: 'Teachers cannot mark attendance for past dates.' });
    }
  }

  const ops = records.map(record => ({
    updateOne: {
      filter: { student: record.studentId, subject, date: attendanceDate },
      update: {
        $set: {
          student: record.studentId,
          subject,
          subjectCode,
          isLab: isLab || false,
          date: attendanceDate,
          status: record.status,
          branch, year, section,
          markedBy: req.user._id,
          markedByModel: req.userRole === 'admin' ? 'Admin' : 'Teacher',
          remarks: record.remarks
        }
      },
      upsert: true
    }
  }));

  await Attendance.bulkWrite(ops);

  res.status(201).json({
    success: true,
    message: `Attendance marked for ${records.length} students.`
  });
};

// ─── Get Attendance for Student ───────────────────────────────────────────────
const getStudentAttendance = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;

  // Students can only view their own attendance
  if (req.userRole === 'student' && studentId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const { subject, startDate, endDate, view } = req.query;
  const filter = { student: studentId };

  if (subject) filter.subject = subject;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  // Date range presets
  if (view === 'weekly') {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    filter.date = { $gte: start };
  } else if (view === 'monthly') {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    filter.date = { $gte: start };
  }

  const [records, summary] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).limit(200),
    Attendance.getAttendanceSummary(studentId, subject ? { subject } : {})
  ]);

  res.json({ success: true, data: { records, summary } });
};

// ─── Get Class Attendance (Teacher/Admin) ─────────────────────────────────────
const getClassAttendance = async (req, res) => {
  const { branch, year, section, subject, date, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = parseInt(year);
  if (section) filter.section = section;
  if (subject) filter.subject = subject;

  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = { $gte: d, $lt: nextDay };
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('student', 'firstName lastName rollNumber')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Attendance.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
  });
};

// ─── Edit Attendance (Admin Only) ─────────────────────────────────────────────
const editAttendance = async (req, res) => {
  const { status, remarks } = req.body;

  const record = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      status, remarks,
      isEdited: true,
      editedBy: req.user._id,
      editedAt: new Date()
    },
    { new: true, runValidators: true }
  ).populate('student', 'firstName lastName rollNumber');

  if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

  res.json({ success: true, data: record, message: 'Attendance updated.' });
};

// ─── Export Attendance CSV ────────────────────────────────────────────────────
const exportAttendance = async (req, res) => {
  const { branch, year, section, subject, startDate, endDate } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = parseInt(year);
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(filter)
    .populate('student', 'firstName lastName rollNumber')
    .populate('markedBy', 'firstName lastName')
    .sort({ date: -1 });

  const data = records.map(r => ({
    rollNumber: r.student?.rollNumber || 'N/A',
    studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : 'N/A',
    subject: r.subject,
    date: r.date.toISOString().split('T')[0],
    status: r.status,
    markedBy: r.markedBy ? `${r.markedBy.firstName} ${r.markedBy.lastName}` : 'N/A'
  }));

  const filename = `attendance_${Date.now()}`;
  const filePath = await exportAttendanceCSV(data, filename);

  res.download(filePath, `${filename}.csv`, (err) => {
    if (err) res.status(500).json({ success: false, message: 'Export failed.' });
  });
};

// ─── Get Attendance Stats for Admin Dashboard ─────────────────────────────────
const getAttendanceStats = async (req, res) => {
  const { branch, year, section } = req.query;
  const match = {};
  if (branch) match.branch = branch;
  if (year) match.year = parseInt(year);
  if (section) match.section = section;

  const stats = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0, total: 1, present: 1, absent: 1,
        percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2] }
      }
    }
  ]);

  res.json({ success: true, data: stats[0] || { total: 0, present: 0, absent: 0, percentage: 0 } });
};

module.exports = {
  markAttendance, getStudentAttendance, getClassAttendance,
  editAttendance, exportAttendance, getAttendanceStats
};
