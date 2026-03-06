const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true }, // positive for earned, negative for spent
  reason: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // e.g., serviceId, ratingId, etc.
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);