const express = require('express');
const router = express.Router();
const { getAllTeachers, getTeacherById, updateTeacher, approveTeacher, deleteTeacher, assignSubject, getTeacherDashboard } = require('../controllers/teacherController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, adminOnly } = require('../middlewares/roleMiddleware');

router.use(protect);
router.get('/dashboard', authorize('teacher'), getTeacherDashboard);
router.get('/', authorize('admin'), getAllTeachers);
router.get('/:id', authorize('admin', 'teacher'), getTeacherById);
router.put('/:id', adminOnly, updateTeacher);
router.patch('/:id/approve', adminOnly, approveTeacher);
router.delete('/:id', adminOnly, deleteTeacher);
router.post('/:id/assign-subject', adminOnly, assignSubject);

module.exports = router;
