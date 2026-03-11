const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  content: String, // HTML or markdown content
  videoUrl: String,
  duration: Number, // in minutes
  order: { type: Number, required: true },
  resources: [{
    name: String,
    url: String,
    type: { type: String, enum: ['pdf', 'video', 'article', 'quiz', 'assignment', 'other'] }
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number, // index of correct option
      points: { type: Number, default: 10 }
    }],
    passingScore: { type: Number, default: 70 }
  }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  shortDescription: { type: String, maxlength: 300 }, // for listings
  category: {
    type: String,
    enum: ['digital_skills', 'healthcare', 'agriculture', 'trades', 'business', 'life_skills', 'other'],
    required: true
  },
  subcategory: String, // e.g., "Web Development" under digital_skills
  tags: [{ type: String, lowercase: true, trim: true }], // for search and filtering
  
  // Provider Information
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerName: String, // denormalized
  providerOrganization: String,
  instructors: [{
    name: String,
    bio: String,
    imageUrl: String,
    credentials: [String]
  }],
  
  // Course Details
  format: { type: String, enum: ['online', 'in_person', 'hybrid'], default: 'online' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all_levels'], default: 'beginner' },
  language: { type: String, default: 'English' },
  location: {
    address: String,
    city: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  
  // Schedule & Duration
  startDate: Date,
  endDate: Date,
  duration: String, // e.g., "4 weeks", "20 hours"
  estimatedHours: Number, // total hours
  schedule: String, // e.g., "Mon-Wed-Fri 6-8 PM"
  timezone: String,
  
  // Content Structure
  modules: [moduleSchema],
  syllabus: [String], // high-level topics
  learningOutcomes: [String], // what students will learn
  prerequisites: [String], // required knowledge/skills
  requirements: String, // technical requirements (e.g., "laptop with internet")
  
  // Enrollment & Capacity
  maxStudents: Number,
  enrolledCount: { type: Number, default: 0 },
  waitlistCount: { type: Number, default: 0 },
  enrollmentDeadline: Date,
  
  // Pricing (optional for monetization)
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  
  // Status & Visibility
  status: { 
    type: String, 
    enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled', 'archived'], 
    default: 'draft' 
  },
  visibility: { type: String, enum: ['public', 'private', 'organization_only'], default: 'public' },
  
  // Certification & Gamification
  certificateIssued: { type: Boolean, default: true },
  certificateTemplate: String, // URL or template ID
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
  pointsAwarded: { type: Number, default: 100 },
  
  // Media
  imageUrl: String,
  thumbnailUrl: String,
  videoIntroUrl: String, // promotional video
  
  // Ratings & Reviews
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount: { type: Number, default: 0 },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Engagement Metrics
  viewCount: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 }, // percentage
  
  // Additional Features
  discussionForumEnabled: { type: Boolean, default: true },
  liveSessions: [{
    title: String,
    scheduledAt: Date,
    duration: Number, // minutes
    meetingUrl: String,
    recording: String
  }],
  partnerOrganizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Indexes for performance
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ providerId: 1, status: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ startDate: 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ 'location.coordinates': '2dsphere' }); // for geospatial queries

// Virtual for full capacity check
courseSchema.virtual('isFull').get(function() {
  return this.maxStudents && this.enrolledCount >= this.maxStudents;
});

// Method to calculate average rating
courseSchema.methods.updateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.ratingsCount = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = Number((sum / this.reviews.length).toFixed(2));
    this.ratingsCount = this.reviews.length;
  }
};

// Method to increment view count
courseSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
