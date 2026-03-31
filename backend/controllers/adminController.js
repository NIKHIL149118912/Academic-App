/**
 * Admin Controller
 */

const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const Feedback = require('../models/Feedback');

// ─── Dashboard Analytics ──────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  const [
    totalStudents, activeStudents,
    totalTeachers, approvedTeachers,
    totalAttendanceRecords,
    pendingFees,
    recentNotices
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments(),
    Teacher.countDocuments({ isApproved: true, isActive: true }),
    Attendance.countDocuments(),
    Fee.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
    require('../models/Notice').find({ isActive: true }).sort({ createdAt: -1 }).limit(5)
  ]);

  // Branch-wise student distribution
  const branchDistribution = await Student.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$branch', count: { $sum: 1 } } }
  ]);

  // Monthly attendance trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const attendanceTrend = await Attendance.aggregate([
    { $match: { date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalStudents, activeStudents, totalTeachers, approvedTeachers,
        totalAttendanceRecords, pendingFees
      },
      branchDistribution,
      attendanceTrend,
      recentNotices
    }
  });
};

// ─── Update Academic Policies ─────────────────────────────────────────────────
const updatePolicies = async (req, res) => {
  const { feedbackEnabled, attendanceThreshold, marksDeadline, examSchedulePublished } = req.body;

  const admin = await Admin.findByIdAndUpdate(
    req.user._id,
    {
      'academicPolicies.feedbackEnabled': feedbackEnabled,
      'academicPolicies.attendanceThreshold': attendanceThreshold,
      'academicPolicies.marksDeadline': marksDeadline,
      'academicPolicies.examSchedulePublished': examSchedulePublished
    },
    { new: true }
  ).select('-password -refreshToken');

  res.json({ success: true, data: admin.academicPolicies, message: 'Policies updated.' });
};

// ─── Get Policies ─────────────────────────────────────────────────────────────
const getPolicies = async (req, res) => {
  const admin = await Admin.findOne({ isActive: true }).select('academicPolicies');
  res.json({ success: true, data: admin?.academicPolicies || {} });
};

// ─── Get Feedback Analytics ───────────────────────────────────────────────────
const getFeedbackAnalytics = async (req, res) => {
  const { teacherId, academicYear } = req.query;
  const match = {};
  if (teacherId) match.teacher = require('mongoose').Types.ObjectId(teacherId);
  if (academicYear) match.academicYear = academicYear;

  const analytics = await Feedback.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$teacher',
        totalFeedbacks: { $sum: 1 },
        avgTeachingQuality: { $avg: '$ratings.teachingQuality' },
        avgSubjectKnowledge: { $avg: '$ratings.subjectKnowledge' },
        avgPunctuality: { $avg: '$ratings.punctuality' },
        avgCommunication: { $avg: '$ratings.communication' },
        avgHelpfulness: { $avg: '$ratings.helpfulness' }
      }
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: '_id',
        as: 'teacher'
      }
    },
    { $unwind: '$teacher' },
    {
      $project: {
        teacherName: { $concat: ['$teacher.firstName', ' ', '$teacher.lastName'] },
        teacherId: '$teacher.teacherId',
        totalFeedbacks: 1,
        avgTeachingQuality: { $round: ['$avgTeachingQuality', 2] },
        avgSubjectKnowledge: { $round: ['$avgSubjectKnowledge', 2] },
        avgPunctuality: { $round: ['$avgPunctuality', 2] },
        avgCommunication: { $round: ['$avgCommunication', 2] },
        avgHelpfulness: { $round: ['$avgHelpfulness', 2] }
      }
    }
  ]);

  res.json({ success: true, data: analytics });
};

module.exports = { getDashboard, updatePolicies, getPolicies, getFeedbackAnalytics };
