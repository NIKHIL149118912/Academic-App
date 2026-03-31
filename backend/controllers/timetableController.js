const Timetable = require('../models/Timetable');

const createTimetable = async (req, res) => {
  const { branch, year, section, semester, academicYear, schedule } = req.body;

  // Deactivate old timetable
  await Timetable.updateMany({ branch, year, section, isActive: true }, { isActive: false });

  const timetable = await Timetable.create({
    branch, year, section, semester, academicYear, schedule,
    fileUrl: req.file ? `/uploads/timetable/${req.file.filename}` : null,
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, data: timetable, message: 'Timetable created.' });
};

const getTimetable = async (req, res) => {
  const { branch, year, section } = req.query;

  let filter = { isActive: true };

  if (req.userRole === 'student') {
    filter.branch = req.user.branch;
    filter.year = req.user.year;
    filter.section = req.user.section;
  } else if (req.userRole === 'teacher') {
    // Teachers see timetable for their assigned classes
    const teacher = req.user;
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
  } else {
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
  }

  const timetable = await Timetable.findOne(filter)
    .populate('schedule.monday.teacher', 'firstName lastName')
    .populate('schedule.tuesday.teacher', 'firstName lastName')
    .populate('schedule.wednesday.teacher', 'firstName lastName')
    .populate('schedule.thursday.teacher', 'firstName lastName')
    .populate('schedule.friday.teacher', 'firstName lastName')
    .populate('schedule.saturday.teacher', 'firstName lastName');

  res.json({ success: true, data: timetable || null });
};

const updateTimetable = async (req, res) => {
  const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });
  res.json({ success: true, data: timetable });
};

module.exports = { createTimetable, getTimetable, updateTimetable };
