const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, submitAssignment, reviewSubmission, deleteAssignment } = require('../controllers/assignmentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, teacherOrAdmin } = require('../middlewares/roleMiddleware');
const { uploadAssignment } = require('../middlewares/uploadMiddleware');

router.use(protect);
router.post('/', teacherOrAdmin, uploadAssignment.array('attachments', 3), createAssignment);
router.get('/', getAssignments);
router.post('/:id/submit', authorize('student'), uploadAssignment.single('file'), submitAssignment);
router.put('/:id/review', teacherOrAdmin, reviewSubmission);
router.delete('/:id', teacherOrAdmin, deleteAssignment);

module.exports = router;
