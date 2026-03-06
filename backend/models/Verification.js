const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentType: {
    type: String,
    enum: ['id', 'police_clearance', 'proof_of_address', 'certificate', 'reference'],
    required: true
  },
  documentUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  expiresAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Verification', verificationSchema);