/**
 * Marks Controller
 */

const Marks = require('../models/Marks');
const Admin = require('../models/Admin');
const { exportMarksCSV, calculateGrade } = require('../utils/csvExport');

// ─── Upload Marks (Teacher/Admin) ─────────────────────────────────────────────
const uploadMarks = async (req, res) => {
  const { branch, year, section, subject, subjectCode, examType, examName, totalMarks, examDate, academicYear, records } = req.body;

  // Check deadline (teachers only)
  if (req.userRole === 'teacher') {
    const admin = await Admin.findOne({ isActive: true });
    if (admin?.academicPolicies?.marksDeadline && new Date() > admin.academicPolicies.marksDeadline) {
      return res.status(403).json({ success: false, message: 'Marks submission deadline has passed.' });
    }
  }

  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'Records array is required.' });
  }

  const ops = records.map(record => ({
    updateOne: {
      filter: { student: record.studentId, subject, examType, examName },
      update: {
        $set: {
          student: record.studentId,
          subject, subjectCode, examType, examName,
          marksObtained: record.marksObtained,
          totalMarks, examDate, academicYear,
          branch, year, section,
          uploadedBy: req.user._id,
          uploadedByModel: req.userRole === 'admin' ? 'Admin' : 'Teacher',
          remarks: record.remarks
        }
      },
      upsert: true
    }
  }));

  await Marks.bulkWrite(ops);

  res.status(201).json({ success: true, message: `Marks uploaded for ${records.length} students.` });
};

// ─── Get Student Marks ────────────────────────────────────────────────────────
const getStudentMarks = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;

  if (req.userRole === 'student' && studentId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const { subject, examType } = req.query;
  const filter = { student: studentId };
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;

  const marks = await Marks.find(filter).sort({ createdAt: -1 });

  // Group by subject and exam type
  const grouped = marks.reduce((acc, mark) => {
    if (!acc[mark.subject]) acc[mark.subject] = {};
    if (!acc[mark.subject][mark.examType]) acc[mark.subject][mark.examType] = [];
    acc[mark.subject][mark.examType].push({
      ...mark.toObject(),
      percentage: ((mark.marksObtained / mark.totalMarks) * 100).toFixed(2),
      grade: calculateGrade((mark.marksObtained / mark.totalMarks) * 100)
    });
    return acc;
  }, {});

  // Overall stats
  const totalObtained = marks.reduce((s, m) => s + m.marksObtained, 0);
  const totalMax = marks.reduce((s, m) => s + m.totalMarks, 0);

  res.json({
    success: true,
    data: {
      marks, grouped,
      overall: {
        totalObtained, totalMax,
        percentage: totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0,
        grade: totalMax > 0 ? calculateGrade((totalObtained / totalMax) * 100) : 'N/A'
      }
    }
  });
};

// ─── Get Class Marks (Teacher/Admin) ──────────────────────────────────────────
const getClassMarks = async (req, res) => {
  const { branch, year, section, subject, examType, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = parseInt(year);
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [marks, total] = await Promise.all([
    Marks.find(filter)
      .populate('student', 'firstName lastName rollNumber')
      .sort({ 'student.rollNumber': 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Marks.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: marks.map(m => ({
      ...m.toObject(),
      percentage: ((m.marksObtained / m.totalMarks) * 100).toFixed(2),
      grade: calculateGrade((m.marksObtained / m.totalMarks) * 100)
    })),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
  });
};

// ─── Edit Marks (Admin) ───────────────────────────────────────────────────────
const editMarks = async (req, res) => {
  const { marksObtained, remarks } = req.body;

  const mark = await Marks.findByIdAndUpdate(
    req.params.id,
    { marksObtained, remarks, isEdited: true, editedBy: req.user._id },
    { new: true, runValidators: true }
  ).populate('student', 'firstName lastName rollNumber');

  if (!mark) return res.status(404).json({ success: false, message: 'Marks record not found.' });

  res.json({ success: true, data: mark });
};

// ─── Export Marks CSV ─────────────────────────────────────────────────────────
const exportMarks = async (req, res) => {
  const { branch, year, section, subject, examType } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = parseInt(year);
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;

  const marks = await Marks.find(filter)
    .populate('student', 'firstName lastName rollNumber')
    .sort({ 'student.rollNumber': 1 });

  const data = marks.map(m => {
    const pct = (m.marksObtained / m.totalMarks) * 100;
    return {
      rollNumber: m.student?.rollNumber || 'N/A',
      studentName: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'N/A',
      subject: m.subject,
      examType: m.examType,
      marksObtained: m.marksObtained,
      totalMarks: m.totalMarks,
      percentage: pct.toFixed(2),
      grade: calculateGrade(pct)
    };
  });

  const filename = `marks_${Date.now()}`;
  const filePath = await exportMarksCSV(data, filename);

  res.download(filePath, `${filename}.csv`, (err) => {
    if (err) res.status(500).json({ success: false, message: 'Export failed.' });
  });
};

module.exports = { uploadMarks, getStudentMarks, getClassMarks, editMarks, exportMarks };
