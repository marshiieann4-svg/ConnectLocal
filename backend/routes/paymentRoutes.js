const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initiatePayment,
  payfastWebhook,
  releasePayment,
  refundPayment,
  getServicePayment,
  getPaymentHistory
} = require('../controllers/paymentController');

// Public — PayFast IPN callback (no auth, PayFast servers call this)
router.post('/webhook', express.urlencoded({ extended: false }), payfastWebhook);

// Protected routes
router.post('/initiate', protect, initiatePayment);
router.post('/:id/release', protect, releasePayment);
router.post('/:id/refund', protect, refundPayment);
router.get('/service/:serviceId', protect, getServicePayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
