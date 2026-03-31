/**
 * Notice Controller
 */

const Notice = require('../models/Notice');

const createNotice = async (req, res) => {
  const { title, content, type, targetAudience, targetBranch, targetYear, targetSection, isPinned, expiresAt } = req.body;

  const notice = await Notice.create({
    title, content, type, targetAudience, targetBranch, targetYear,
    targetSection, isPinned, expiresAt, createdBy: req.user._id
  });

  res.status(201).json({ success: true, data: notice, message: 'Notice created.' });
};

const getNotices = async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const filter = { isActive: true };
  if (type) filter.type = type;

  // Role-based filtering
  if (req.userRole === 'student') {
    filter.targetAudience = { $in: ['all', 'students'] };
  } else if (req.userRole === 'teacher') {
    filter.targetAudience = { $in: ['all', 'teachers'] };
  }

  // Expired notices
  filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notice.countDocuments(filter)
  ]);

  res.json({ success: true, data: notices, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

const updateNotice = async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  res.json({ success: true, data: notice });
};

const deleteNotice = async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  res.json({ success: true, message: 'Notice deleted.' });
};

module.exports = { createNotice, getNotices, updateNotice, deleteNotice };
