const express = require('express');
const router = express.Router();
const { registerStudent, registerTeacher, registerAdmin, login, refreshToken, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/register/student', registerStudent);
router.post('/register/teacher', registerTeacher);
router.post('/register/admin', registerAdmin);
router.post('/login', authRateLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
