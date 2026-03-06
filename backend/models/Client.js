const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  phone: String,
  address: String,
  ward: { type: String, required: true },
  dateOfBirth: Date,
  gender: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  careNotes: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);