const express = require('express');
const router = express.Router();
const { createTimetable, getTimetable, updateTimetable } = require('../controllers/timetableController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const { uploadTimetable } = require('../middlewares/uploadMiddleware');

router.use(protect);
router.get('/', getTimetable);
router.post('/', adminOnly, uploadTimetable.single('file'), createTimetable);
router.put('/:id', adminOnly, updateTimetable);

module.exports = router;
