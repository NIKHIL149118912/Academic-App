const express = require('express');
const router = express.Router();
const { getAllStudents, getStudentById, updateStudent, deleteStudent, getStudentDashboard, updateProfile, changePassword } = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, adminOnly } = require('../middlewares/roleMiddleware');
const { uploadProfile } = require('../middlewares/uploadMiddleware');

router.use(protect);
router.get('/dashboard', authorize('student'), getStudentDashboard);
router.put('/profile', authorize('student'), uploadProfile.single('profileImage'), updateProfile);
router.put('/change-password', authorize('student'), changePassword);
router.get('/', authorize('admin', 'teacher'), getAllStudents);
router.get('/:id', authorize('admin', 'teacher'), getStudentById);
router.put('/:id', adminOnly, updateStudent);
router.delete('/:id', adminOnly, deleteStudent);

module.exports = router;
