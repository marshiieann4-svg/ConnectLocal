const mongoose = require('mongoose');

const safetyLogSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: Date,
  checkInLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  checkOutLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out', 'missed'],
    default: 'checked_in'
  },
  notes: String,
  alertSent: { type: Boolean, default: false }
}, { timestamps: true });

safetyLogSchema.index({ checkInLocation: '2dsphere' });
safetyLogSchema.index({ checkOutLocation: '2dsphere' });

module.exports = mongoose.model('SafetyLog', safetyLogSchema);