const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  checkIn, checkOut, getHistory,
  serviceCheckIn, serviceCheckOut, confirmCheckIn, disputeCheckIn, getServiceSafetyLogs
} = require('../controllers/safetycontroller');

// Service-based safety (main user flow)
router.post('/service-checkin/:serviceId', protect, serviceCheckIn);
router.put('/service-checkout/:logId', protect, serviceCheckOut);
router.put('/confirm/:logId', protect, confirmCheckIn);
router.put('/dispute/:logId', protect, disputeCheckIn);
router.get('/service/:serviceId', protect, getServiceSafetyLogs);

// Assignment-based safety (org flow)
router.post('/checkin/:assignmentId', protect, checkIn);
router.put('/checkout/:logId', protect, checkOut);
router.get('/history/:assignmentId', protect, getHistory);

module.exports = router;