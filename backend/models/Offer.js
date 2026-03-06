const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  helperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  proposedAmount: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a helper can only apply once per service
offerSchema.index({ serviceId: 1, helperId: 1 }, { unique: true });

module.exports = mongoose.model('Offer', offerSchema);