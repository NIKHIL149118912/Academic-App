/**
 * Assignment Controller
 */

const Assignment = require('../models/Assignment');
const path = require('path');

// ─── Create Assignment (Teacher) ──────────────────────────────────────────────
const createAssignment = async (req, res) => {
  const { title, description, subject, subjectCode, branch, year, section, deadline, totalMarks } = req.body;

  const assignment = await Assignment.create({
    title, description, subject, subjectCode, branch,
    year: parseInt(year), section, deadline, totalMarks,
    createdBy: req.user._id,
    attachments: req.files?.map(f => ({
      fileUrl: `/uploads/assignments/${f.filename}`,
      originalName: f.originalname
    })) || []
  });

  res.status(201).json({ success: true, data: assignment, message: 'Assignment created.' });
};

// ─── Get Assignments ──────────────────────────────────────────────────────────
const getAssignments = async (req, res) => {
  const { branch, year, section, subject, page = 1, limit = 20 } = req.query;

  let filter = { isActive: true };

  if (req.userRole === 'student') {
    filter.branch = req.user.branch;
    filter.year = req.user.year;
    filter.section = req.user.section;
  } else if (req.userRole === 'teacher') {
    filter.createdBy = req.user._id;
  } else {
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
    if (subject) filter.subject = subject;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [assignments, total] = await Promise.all([
    Assignment.find(filter)
      .populate('createdBy', 'firstName lastName teacherId')
      .sort({ deadline: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Assignment.countDocuments(filter)
  ]);

  // For students, add submission status
  if (req.userRole === 'student') {
    const data = assignments.map(a => {
      const submission = a.submissions.find(
        s => s.student.toString() === req.user._id.toString()
      );
      return { ...a.toObject(), mySubmission: submission || null };
    });
    return res.json({
      success: true, data,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  }

  res.json({
    success: true, data: assignments,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
  });
};

// ─── Submit Assignment (Student) ──────────────────────────────────────────────
const submitAssignment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'PDF file is required.' });
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

  if (!assignment.isActive) {
    return res.status(400).json({ success: false, message: 'Assignment is closed.' });
  }

  // Check if already submitted
  const existingIdx = assignment.submissions.findIndex(
    s => s.student.toString() === req.user._id.toString()
  );

  const submission = {
    student: req.user._id,
    fileUrl: `/uploads/assignments/${req.file.filename}`,
    originalName: req.file.originalname,
    submittedAt: new Date(),
    isLate: new Date() > assignment.deadline
  };

  if (existingIdx >= 0) {
    assignment.submissions[existingIdx] = submission;
  } else {
    assignment.submissions.push(submission);
  }

  await assignment.save();

  res.json({
    success: true,
    message: submission.isLate ? 'Assignment submitted (late).' : 'Assignment submitted successfully.',
    data: submission
  });
};

// ─── Review Submission (Teacher) ──────────────────────────────────────────────
const reviewSubmission = async (req, res) => {
  const { studentId, grade, feedback } = req.body;

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

  if (assignment.createdBy.toString() !== req.user._id.toString() && req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to review this assignment.' });
  }

  const sub = assignment.submissions.find(s => s.student.toString() === studentId);
  if (!sub) return res.status(404).json({ success: false, message: 'Submission not found.' });

  sub.grade = grade;
  sub.feedback = feedback;
  sub.reviewedAt = new Date();
  sub.reviewedBy = req.user._id;

  await assignment.save();

  res.json({ success: true, message: 'Submission reviewed.', data: sub });
};

// ─── Delete Assignment (Teacher/Admin) ───────────────────────────────────────
const deleteAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

  if (req.userRole === 'teacher' && assignment.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  assignment.isActive = false;
  await assignment.save();

  res.json({ success: true, message: 'Assignment removed.' });
};

module.exports = { createAssignment, getAssignments, submitAssignment, reviewSubmission, deleteAssignment };
