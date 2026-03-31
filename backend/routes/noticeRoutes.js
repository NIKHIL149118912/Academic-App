const express = require('express');
const router = express.Router();
const { createNotice, getNotices, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');

router.use(protect);
router.get('/', getNotices);
router.post('/', adminOnly, createNotice);
router.put('/:id', adminOnly, updateNotice);
router.delete('/:id', adminOnly, deleteNotice);

module.exports = router;
