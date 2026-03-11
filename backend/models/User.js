const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true, trim: true },
  name: { type: String, required: true },
  // Account type: individual, organization, home_care, dropin_centre, admin
  accountType: {
    type: String,
    enum: ['individual', 'organization', 'home_care', 'dropin_centre', 'admin'],
    default: 'individual'
  },
  // Legacy role field found in older records (e.g. "Admin").
  userType: {
    type: String,
    trim: true
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
  // Languages spoken
  languages: [{ type: String }],
  // Certifications and training
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  // Work experience
  experience: {
    years: { type: Number, default: 0 },
    description: String
  },
  // Background check
  backgroundCheckDate: Date,
  backgroundCheckStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  // Emergency contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  // For helpers: services they can offer
  servicesOffered: [{
    type: String,
    enum: [
      'companionship', 
      'meal_preparation', 
      'transportation', 
      'cleaning', 
      'shopping', 
      'medication_reminders',
      'personal_care',
      'respite_care',
      'mobility_assistance',
      'other'
    ]
  }],
  // Availability schedule
  availability: {
    monday: { available: Boolean, startTime: String, endTime: String },
    tuesday: { available: Boolean, startTime: String, endTime: String },
    wednesday: { available: Boolean, startTime: String, endTime: String },
    thursday: { available: Boolean, startTime: String, endTime: String },
    friday: { available: Boolean, startTime: String, endTime: String },
    saturday: { available: Boolean, startTime: String, endTime: String },
    sunday: { available: Boolean, startTime: String, endTime: String }
  },
  // Preferences
  preferences: {
    maxDistance: { type: Number, default: 10 }, // km
    hourlyRate: Number, // for helpers
    paymentMethod: String,
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  // Status
  isActive: { type: Boolean, default: true },
  // Points and badges
  points: { type: Number, default: 0 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  // Optional: track level based on points
  level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);