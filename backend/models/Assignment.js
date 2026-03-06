const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: String, // e.g., "elderly care", "check-in", "gardening"
  schedule: String, // e.g., "daily", "weekly"
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);