const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  raterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Multi-dimensional ratings (1-5)
  communication: { type: Number, min: 1, max: 5, required: true },
  reliability: { type: Number, min: 1, max: 5, required: true },
  quality: { type: Number, min: 1, max: 5, required: true },
  overall: { type: Number, min: 1, max: 5 }, // computed average
  comment: { type: String, maxlength: 500 },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save middleware to calculate overall average
ratingSchema.pre('save', function(next) {
  this.overall = (this.communication + this.reliability + this.quality) / 3;
  next();
});

// Ensure a user can rate a service only once
ratingSchema.index({ serviceId: 1, raterId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);