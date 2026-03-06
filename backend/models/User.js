const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true, trim: true },
  name: { type: String, required: true },
  // Account type: individual, organization, home_care, dropin_centre
  accountType: {
    type: String,
    enum: ['individual', 'organization', 'home_care', 'dropin_centre'],
    default: 'individual'
  },
  // For individuals only: their role (helper, requester, both)
  role: {
    type: String,
    enum: ['helper', 'requester', 'both'],
    default: null
  },
  // For organizations / care centers
  organizationName: String,
  registrationNumber: String,
  // Location
  ward: { type: String, required: true },
  // Profile
  bio: String,
  profilePicture: String, // URL to uploaded image
  // Verification
  verificationLevel: { type: Number, default: 0, min: 0, max: 3 },
  idVerified: { type: Boolean, default: false },
  policeClearance: { type: Boolean, default: false },
  // Trust & ratings
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  communityPoints: { type: Number, default: 0 },
  // Skills (for helpers)
  skills: [{
    name: String,
    category: String,
    experienceLevel: String
  }],
  // Status
  isActive: { type: Boolean, default: true },
  // Points and badges
  points: { type: Number, default: 0 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  // Optional: track level based on points
  level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);