const mongoose = require('mongoose');

const safetyLogSchema = new mongoose.Schema({
  // Support both assignment-based and service-based check-ins
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: Date,
  checkInLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  checkOutLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  // Selfie photo paths
  checkInPhoto: { type: String },
  checkOutPhoto: { type: String },
  // Requester confirmation
  requesterConfirmed: { type: Boolean, default: false },
  requesterConfirmedAt: { type: Date },
  requesterDisputed: { type: Boolean, default: false },
  disputeReason: { type: String },
  status: {
    type: String,
    enum: ['checked_in', 'confirmed', 'checked_out', 'completed', 'missed', 'disputed'],
    default: 'checked_in'
  },
  notes: String,
  alertSent: { type: Boolean, default: false }
}, { timestamps: true });

safetyLogSchema.index({ checkInLocation: '2dsphere' });
safetyLogSchema.index({ checkOutLocation: '2dsphere' });

module.exports = mongoose.model('SafetyLog', safetyLogSchema);