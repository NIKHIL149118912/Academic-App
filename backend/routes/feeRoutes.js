const express = require('express');
const router = express.Router();
const { addFee, getStudentFees, updateFee, exportFees } = require('../controllers/feeController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');

router.use(protect);
router.post('/', adminOnly, addFee);
router.get('/export', adminOnly, exportFees);
router.get('/student/:studentId?', getStudentFees);
router.put('/:id', adminOnly, updateFee);

module.exports = router;
