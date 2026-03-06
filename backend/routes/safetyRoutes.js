const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkIn, checkOut, getHistory } = require('../controllers/safetycontroller');

router.post('/checkin/:assignmentId', protect, checkIn);
router.put('/checkout/:logId', protect, checkOut);
router.get('/history/:assignmentId', protect, getHistory);

module.exports = router;