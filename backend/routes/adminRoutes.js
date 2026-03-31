const express = require('express');
const router = express.Router();
const { getDashboard, updatePolicies, getPolicies, getFeedbackAnalytics } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');

router.use(protect, adminOnly);
router.get('/dashboard', getDashboard);
router.get('/policies', getPolicies);
router.put('/policies', updatePolicies);
router.get('/feedback-analytics', getFeedbackAnalytics);

module.exports = router;
