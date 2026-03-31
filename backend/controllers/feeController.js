const Fee = require('../models/Fee');
const { exportFeeCSV } = require('../utils/csvExport');

const addFee = async (req, res) => {
  const fee = await Fee.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: fee });
};

const getStudentFees = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;
  if (req.userRole === 'student' && studentId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const { academicYear, semester, status } = req.query;
  const filter = { student: studentId };
  if (academicYear) filter.academicYear = academicYear;
  if (semester) filter.semester = parseInt(semester);
  if (status) filter.status = status;

  const fees = await Fee.find(filter).sort({ dueDate: 1 });
  const total = fees.reduce((s, f) => s + f.amount, 0);
  const paid = fees.reduce((s, f) => s + f.paidAmount, 0);

  res.json({ success: true, data: fees, summary: { total, paid, balance: total - paid } });
};

const updateFee = async (req, res) => {
  const fee = await Fee.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  ).populate('student', 'firstName lastName rollNumber');

  if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });
  res.json({ success: true, data: fee });
};

const exportFees = async (req, res) => {
  const { academicYear, semester, status, branch, year } = req.query;
  const filter = {};
  if (academicYear) filter.academicYear = academicYear;
  if (semester) filter.semester = parseInt(semester);
  if (status) filter.status = status;

  const fees = await Fee.find(filter).populate('student', 'firstName lastName rollNumber branch year');
  const data = fees.map(f => ({
    rollNumber: f.student?.rollNumber || 'N/A',
    studentName: f.student ? `${f.student.firstName} ${f.student.lastName}` : 'N/A',
    feeType: f.feeType,
    amount: f.amount,
    dueDate: f.dueDate?.toISOString().split('T')[0] || '',
    paidDate: f.paidDate?.toISOString().split('T')[0] || '',
    status: f.status,
    semester: f.semester
  }));

  const filename = `fees_${Date.now()}`;
  const filePath = await exportFeeCSV(data, filename);
  res.download(filePath, `${filename}.csv`);
};

module.exports = { addFee, getStudentFees, updateFee, exportFees };
