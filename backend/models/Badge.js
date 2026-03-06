const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String, // Font Awesome class or image URL
  category: { type: String, enum: ['service', 'rating', 'referral', 'special'] },
  criteria: {
    type: { type: String, enum: ['count', 'rating', 'points'] },
    value: Number,
    serviceCategory: String // optional, e.g., 'gardening'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', badgeSchema);