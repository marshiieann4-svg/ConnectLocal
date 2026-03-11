const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'ZAR' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'escrowed', 'released', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['payfast', 'manual'], default: 'payfast' },
  // PayFast fields
  payfastPaymentId: { type: String },
  payfastToken: { type: String },
  // Escrow tracking
  escrowedAt: { type: Date },
  releasedAt: { type: Date },
  refundedAt: { type: Date },
  // Notes
  description: { type: String },
  adminNotes: { type: String }
}, { timestamps: true });

paymentSchema.index({ serviceId: 1 });
paymentSchema.index({ payerId: 1 });
paymentSchema.index({ payeeId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
