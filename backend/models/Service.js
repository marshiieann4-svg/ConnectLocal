const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please describe what help is needed']
  },
  category: {
    type: String,
    enum: ['gardening', 'tutoring', 'elderly_care', 'childcare', 'transport', 'repairs', 'other'],
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: {
    type: String,
    required: [true, 'Please provide a location']
  },
  urgency: {
    type: String,
    enum: ['today', 'this_week', 'anytime'],
    default: 'anytime'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  scheduledDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  // For geospatial queries (optional)
  locationCoords: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt
});

// Create index for searching
serviceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);