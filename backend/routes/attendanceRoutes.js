const express = require('express');
const router = express.Router();
const { markAttendance, getStudentAttendance, getClassAttendance, editAttendance, exportAttendance, getAttendanceStats } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, adminOnly, teacherOrAdmin } = require('../middlewares/roleMiddleware');

router.use(protect);
router.post('/', teacherOrAdmin, markAttendance);
router.get('/stats', teacherOrAdmin, getAttendanceStats);
router.get('/class', teacherOrAdmin, getClassAttendance);
router.get('/export', adminOnly, exportAttendance);
router.get('/student/:studentId?', getStudentAttendance);
router.put('/:id', adminOnly, editAttendance);

module.exports = router;
