const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referenceName: String,
  referencePhone: String,
  relationship: String,
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  response: String,
  verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Reference', referenceSchema);