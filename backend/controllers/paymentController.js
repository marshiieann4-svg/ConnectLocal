const Payment = require('../models/Payment');
const Service = require('../models/Service');
const { generatePaymentUrl, validateIPN } = require('../services/payfast');

// @desc    Initiate a payment for a service (creates pending payment + returns PayFast URL)
// @route   POST /api/payments/initiate
const initiatePayment = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const service = await Service.findById(serviceId).populate('requesterId helperId');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (!service.helperId) {
      return res.status(400).json({ success: false, message: 'No helper assigned to this service' });
    }
    if (!service.paymentAmount || service.paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Service has no payment amount set' });
    }

    // Prevent duplicate pending payments for the same service
    const existing = await Payment.findOne({
      serviceId,
      status: { $in: ['pending', 'paid', 'escrowed'] }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A payment already exists for this service', data: existing });
    }

    const payment = await Payment.create({
      serviceId,
      payerId: service.requesterId._id,
      payeeId: service.helperId._id,
      amount: service.paymentAmount,
      description: `Payment for: ${service.title}`
    });

    const paymentUrl = generatePaymentUrl({
      paymentId: payment._id.toString(),
      amount: payment.amount,
      itemName: service.title,
      buyerEmail: service.requesterId.email,
      buyerName: service.requesterId.name
    });

    res.status(201).json({
      success: true,
      data: { payment, paymentUrl }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    PayFast IPN webhook — called by PayFast servers (no auth)
// @route   POST /api/payments/webhook
const payfastWebhook = async (req, res) => {
  try {
    // Validate signature
    if (!validateIPN(req.body)) {
      console.warn('PayFast IPN: invalid signature', req.body);
      return res.status(400).send('Invalid signature');
    }

    const { m_payment_id, payment_status, pf_payment_id, amount_gross } = req.body;

    const payment = await Payment.findById(m_payment_id);
    if (!payment) {
      console.warn('PayFast IPN: payment not found', m_payment_id);
      return res.status(404).send('Payment not found');
    }

    // Verify amount matches
    if (Number(amount_gross) !== payment.amount) {
      console.warn('PayFast IPN: amount mismatch', { expected: payment.amount, got: amount_gross });
      return res.status(400).send('Amount mismatch');
    }

    payment.payfastPaymentId = pf_payment_id;

    if (payment_status === 'COMPLETE') {
      payment.status = 'escrowed';
      payment.escrowedAt = new Date();
    } else if (payment_status === 'CANCELLED') {
      payment.status = 'failed';
    }

    await payment.save();

    // Update service status if payment went through
    if (payment.status === 'escrowed') {
      await Service.findByIdAndUpdate(payment.serviceId, { status: 'in_progress' });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayFast webhook error:', error);
    res.status(500).send('Error');
  }
};

// @desc    Release escrowed funds to helper (org/admin action)
// @route   POST /api/payments/:id/release
const releasePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status !== 'escrowed') {
      return res.status(400).json({ success: false, message: `Cannot release payment in ${payment.status} status` });
    }

    payment.status = 'released';
    payment.releasedAt = new Date();
    await payment.save();

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refund a payment (before release only)
// @route   POST /api/payments/:id/refund
const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (!['paid', 'escrowed'].includes(payment.status)) {
      return res.status(400).json({ success: false, message: `Cannot refund payment in ${payment.status} status` });
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.adminNotes = req.body.reason || '';
    await payment.save();

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment for a service
// @route   GET /api/payments/service/:serviceId
const getServicePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ serviceId: req.params.serviceId })
      .populate('payerId', 'name email phone')
      .populate('payeeId', 'name email phone');

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history for the logged-in user
// @route   GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const payments = await Payment.find({
      $or: [{ payerId: userId }, { payeeId: userId }]
    })
      .populate('serviceId', 'title category')
      .populate('payerId', 'name')
      .populate('payeeId', 'name')
      .sort({ createdAt: -1 });

    const summary = {
      totalPaid: payments.filter(p => p.payerId.toString() === userId.toString() && ['escrowed', 'released'].includes(p.status))
        .reduce((s, p) => s + p.amount, 0),
      totalEarned: payments.filter(p => p.payeeId.toString() === userId.toString() && p.status === 'released')
        .reduce((s, p) => s + p.amount, 0),
      pendingEscrow: payments.filter(p => p.payeeId.toString() === userId.toString() && p.status === 'escrowed')
        .reduce((s, p) => s + p.amount, 0)
    };

    res.json({ success: true, data: payments, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initiatePayment,
  payfastWebhook,
  releasePayment,
  refundPayment,
  getServicePayment,
  getPaymentHistory
};
