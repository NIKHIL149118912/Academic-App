// ── marksRoutes.js ────────────────────────────────────────────────────────────
const express = require('express');
const marksRouter = express.Router();
const { uploadMarks, getStudentMarks, getClassMarks, editMarks, exportMarks } = require('../controllers/marksController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, teacherOrAdmin } = require('../middlewares/roleMiddleware');

marksRouter.use(protect);
marksRouter.post('/', teacherOrAdmin, uploadMarks);
marksRouter.get('/class', teacherOrAdmin, getClassMarks);
marksRouter.get('/export', adminOnly, exportMarks);
marksRouter.get('/student/:studentId?', getStudentMarks);
marksRouter.put('/:id', adminOnly, editMarks);

module.exports = marksRouter;
