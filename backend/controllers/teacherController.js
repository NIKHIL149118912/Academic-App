/**
 * Teacher Controller
 */

const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const getAllTeachers = async (req, res) => {
  const { department, isActive, isApproved, page = 1, limit = 20, search } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { teacherId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [teachers, total] = await Promise.all([
    Teacher.find(filter).select('-password -refreshToken').skip(skip).limit(parseInt(limit)),
    Teacher.countDocuments(filter)
  ]);

  res.json({ success: true, data: teachers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

const getTeacherById = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).select('-password -refreshToken');
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
  res.json({ success: true, data: teacher });
};

const updateTeacher = async (req, res) => {
  const disallowed = ['password', 'refreshToken', 'role'];
  disallowed.forEach(f => delete req.body[f]);

  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  }).select('-password -refreshToken');

  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
  res.json({ success: true, data: teacher, message: 'Teacher updated.' });
};

const approveTeacher = async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { isApproved: true },
    { new: true }
  ).select('-password -refreshToken');

  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
  res.json({ success: true, data: teacher, message: 'Teacher approved.' });
};

const deleteTeacher = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
  teacher.isActive = false;
  await teacher.save();
  res.json({ success: true, message: 'Teacher deactivated.' });
};

const assignSubject = async (req, res) => {
  const { subject, subjectCode, branch, year, section, isLab } = req.body;

  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

  // Check duplicate
  const exists = teacher.assignedSubjects.some(
    s => s.subject === subject && s.branch === branch && s.year === parseInt(year) && s.section === section
  );

  if (!exists) {
    teacher.assignedSubjects.push({ subject, subjectCode, branch, year: parseInt(year), section, isLab: isLab || false });
    await teacher.save();
  }

  res.json({ success: true, data: teacher.assignedSubjects, message: 'Subject assigned.' });
};

const getTeacherDashboard = async (req, res) => {
  const teacher = req.user;

  // Count students per class
  const classStats = await Promise.all(
    teacher.assignedSubjects.map(async (sub) => {
      const count = await Student.countDocuments({
        branch: sub.branch, year: sub.year, section: sub.section, isActive: true
      });
      return { ...sub.toObject(), studentCount: count };
    })
  );

  res.json({ success: true, data: { teacher, classStats } });
};

module.exports = { getAllTeachers, getTeacherById, updateTeacher, approveTeacher, deleteTeacher, assignSubject, getTeacherDashboard };
