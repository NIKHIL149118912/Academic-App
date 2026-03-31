/**
 * Feedback Controller
 */

const Feedback = require('../models/Feedback');
const Admin = require('../models/Admin');
const crypto = require('crypto');

const submitFeedback = async (req, res) => {
  // Check if feedback is enabled
  const admin = await Admin.findOne({ isActive: true }).select('academicPolicies');
  if (!admin?.academicPolicies?.feedbackEnabled) {
    return res.status(403).json({ success: false, message: 'Feedback is currently disabled.' });
  }

  const { teacherId, subject, ratings, comments, academicYear } = req.body;

  // Hash student ID for anonymity (can't retrieve student from hash)
  const studentHash = crypto.createHash('sha256').update(req.user._id.toString() + (academicYear || '')).digest('hex');

  try {
    const feedback = await Feedback.create({
      teacher: teacherId,
      subject,
      branch: req.user.branch,
      year: req.user.year,
      section: req.user.section,
      academicYear,
      ratings,
      comments,
      studentHash
    });

    res.status(201).json({ success: true, message: 'Feedback submitted anonymously.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already submitted feedback for this teacher.' });
    }
    throw err;
  }
};

const getFeedbacks = async (req, res) => {
  // Only admin can view feedbacks
  const { teacherId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (teacherId) filter.teacher = teacherId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [feedbacks, total] = await Promise.all([
    Feedback.find(filter)
      .populate('teacher', 'firstName lastName teacherId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-studentHash'),
    Feedback.countDocuments(filter)
  ]);

  res.json({ success: true, data: feedbacks, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

module.exports = { submitFeedback, getFeedbacks };
