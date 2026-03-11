const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  // Core References
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  // Enrollment Status
  status: {
    type: String,
    enum: ['pending', 'enrolled', 'in_progress', 'completed', 'dropped', 'failed', 'waitlisted'],
    default: 'enrolled'
  },
  enrolledAt: { type: Date, default: Date.now },
  startedAt: Date, // when user first accessed course content
  completedAt: Date,
  droppedAt: Date,
  dropReason: String,
  
  // Progress Tracking
  progress: { type: Number, default: 0, min: 0, max: 100 }, // overall progress
  moduleProgress: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
    timeSpent: { type: Number, default: 0 }, // minutes
    lastAccessed: Date
  }],
  
  // Assessment & Performance
  quizScores: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    quizId: mongoose.Schema.Types.ObjectId,
    score: Number, // percentage
    totalQuestions: Number,
    correctAnswers: Number,
    attempts: { type: Number, default: 1 },
    completedAt: Date
  }],
  assignments: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    assignmentId: mongoose.Schema.Types.ObjectId,
    submittedAt: Date,
    fileUrl: String,
    content: String,
    grade: Number, // percentage
    feedback: String,
    gradedAt: Date,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  finalGrade: Number, // 0-100
  
  // Attendance (for live/in-person courses)
  attendance: [{
    sessionId: mongoose.Schema.Types.ObjectId,
    sessionDate: Date,
    attended: { type: Boolean, default: false },
    checkInTime: Date,
    checkOutTime: Date,
    notes: String
  }],
  attendanceRate: { type: Number, default: 0 }, // percentage
  
  // Engagement Metrics
  totalTimeSpent: { type: Number, default: 0 }, // total minutes
  lastAccessedAt: Date,
  accessCount: { type: Number, default: 0 },
  forumParticipation: {
    postsCreated: { type: Number, default: 0 },
    commentsCreated: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 }
  },
  
  // Certification
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: String,
  certificateIssuedAt: Date,
  certificateNumber: String,
  
  // Feedback & Review
  courseRating: { type: Number, min: 1, max: 5 },
  courseReview: String,
  reviewedAt: Date,
  instructorRating: { type: Number, min: 1, max: 5 },
  
  // Gamification & Rewards
  pointsEarned: { type: Number, default: 0 },
  badgesEarned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  achievements: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  
  // Notes & Bookmarks
  notes: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    content: String,
    timestamp: Number, // for video bookmarks
    createdAt: { type: Date, default: Date.now }
  }],
  bookmarks: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    title: String,
    url: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Peer Connections
  studyGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup' },
  peers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // connected classmates
  
  // Payment (if course is paid)
  paymentStatus: { 
    type: String, 
    enum: ['free', 'pending', 'paid', 'refunded', 'failed'], 
    default: 'free' 
  },
  paymentId: String,
  amountPaid: Number,
  paidAt: Date,
  
  // Additional Metadata
  enrollmentSource: { 
    type: String, 
    enum: ['direct', 'referral', 'organization', 'promotion', 'waitlist'], 
    default: 'direct' 
  },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organizationSponsored: { type: Boolean, default: false },
  sponsorOrganization: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Notifications Preferences
  notificationsEnabled: { type: Boolean, default: true },
  remindersSent: { type: Number, default: 0 },
  lastReminderAt: Date
}, { timestamps: true });

// Ensure a user can enroll only once per course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ completedAt: 1 });
enrollmentSchema.index({ status: 1, lastAccessedAt: 1 });

// Virtual for checking if course is active
enrollmentSchema.virtual('isActive').get(function() {
  return ['enrolled', 'in_progress'].includes(this.status);
});

// Method to update overall progress based on module progress
enrollmentSchema.methods.calculateProgress = function() {
  if (this.moduleProgress.length === 0) {
    this.progress = 0;
    return this.progress;
  }
  
  const totalProgress = this.moduleProgress.reduce((sum, mod) => sum + mod.progress, 0);
  this.progress = Number((totalProgress / this.moduleProgress.length).toFixed(2));
  return this.progress;
};

// Method to update attendance rate
enrollmentSchema.methods.calculateAttendanceRate = function() {
  if (this.attendance.length === 0) {
    this.attendanceRate = 0;
    return this.attendanceRate;
  }
  
  const attendedCount = this.attendance.filter(a => a.attended).length;
  this.attendanceRate = Number(((attendedCount / this.attendance.length) * 100).toFixed(2));
  return this.attendanceRate;
};

// Method to mark enrollment as started
enrollmentSchema.methods.startCourse = async function() {
  if (!this.startedAt) {
    this.startedAt = new Date();
    this.status = 'in_progress';
    await this.save();
  }
};

// Method to complete enrollment
enrollmentSchema.methods.completeCourse = async function(finalGrade) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress = 100;
  if (finalGrade !== undefined) {
    this.finalGrade = finalGrade;
  }
  await this.save();
};

// Pre-save hook to auto-update status
enrollmentSchema.pre('save', function(next) {
  if (this.progress === 100 && this.status === 'in_progress') {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
