const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbacks } = require('../controllers/feedbackController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, adminOnly } = require('../middlewares/roleMiddleware');

router.use(protect);
router.post('/', authorize('student'), submitFeedback);
router.get('/', adminOnly, getFeedbacks);

module.exports = router;
