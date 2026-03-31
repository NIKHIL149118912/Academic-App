const express = require('express');
const router = express.Router();
const { uploadNotes, getNotes, downloadNote, deleteNote } = require('../controllers/notesController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, teacherOrAdmin } = require('../middlewares/roleMiddleware');
const { uploadNotes: uploadMiddleware } = require('../middlewares/uploadMiddleware');

router.use(protect);
router.get('/', getNotes);
router.post('/', teacherOrAdmin, uploadMiddleware.single('file'), uploadNotes);
router.get('/:id/download', downloadNote);
router.delete('/:id', teacherOrAdmin, deleteNote);

module.exports = router;
