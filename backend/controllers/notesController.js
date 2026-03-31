const Notes = require('../models/Notes');
const path = require('path');
const fs = require('fs');

const uploadNotes = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required.' });

  const { title, description, subject, subjectCode, topic, branch, year, section } = req.body;

  const note = await Notes.create({
    title, description, subject, subjectCode, topic,
    branch, year: parseInt(year), section,
    fileUrl: `/uploads/notes/${req.file.filename}`,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    uploadedBy: req.user._id
  });

  res.status(201).json({ success: true, data: note, message: 'Notes uploaded.' });
};

const getNotes = async (req, res) => {
  const { branch, year, section, subject, page = 1, limit = 20 } = req.query;

  let filter = { isActive: true };

  if (req.userRole === 'student') {
    filter.branch = req.user.branch;
    filter.year = req.user.year;
    filter.$or = [{ section: req.user.section }, { section: null }];
  } else {
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
  }
  if (subject) filter.subject = subject;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notes, total] = await Promise.all([
    Notes.find(filter)
      .populate('uploadedBy', 'firstName lastName teacherId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notes.countDocuments(filter)
  ]);

  res.json({ success: true, data: notes, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

const downloadNote = async (req, res) => {
  const note = await Notes.findById(req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

  await Notes.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

  const filePath = path.join(__dirname, '..', note.fileUrl);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server.' });
  }

  res.download(filePath, note.originalName);
};

const deleteNote = async (req, res) => {
  const note = await Notes.findById(req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

  if (req.userRole === 'teacher' && note.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  note.isActive = false;
  await note.save();
  res.json({ success: true, message: 'Note removed.' });
};

module.exports = { uploadNotes, getNotes, downloadNote, deleteNote };
