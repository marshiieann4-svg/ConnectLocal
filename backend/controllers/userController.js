const User = require('../models/User');
const Verification = require('../models/Verification');
const Service = require('../models/Service');
const Rating = require('../models/Rating');
const Assignment = require('../models/Assignment');
const Client = require('../models/Client');

// @desc    Get current user's full profile with related data
// @route   GET /api/users/profile
const getFullProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-__v');
    const documents = await Verification.find({ userId });
    const postedServices = await Service.find({ requesterId: userId })
      .sort('-createdAt')
      .limit(10);
    const helpedServices = await Service.find({ helperId: userId })
      .sort('-createdAt')
      .limit(10);
    const ratings = await Rating.find({ ratedId: userId })
      .populate('raterId', 'name')
      .populate('serviceId', 'title')
      .sort('-createdAt')
      .limit(10);

    let clients = [];
    let assignments = [];

    if (user.accountType === 'organization' || user.accountType === 'home_care' || user.accountType === 'dropin_centre') {
      clients = await Client.find({ organizationId: userId }).sort('-createdAt');
      assignments = await Assignment.find({ organizationId: userId })
        .populate('clientId', 'name phone')
        .populate('helperId', 'name')
        .sort('-createdAt')
        .limit(10);
    }

    if (user.accountType === 'individual' && (user.role === 'helper' || user.role === 'both')) {
      assignments = await Assignment.find({ helperId: userId })
        .populate('clientId', 'name phone address')
        .populate('organizationId', 'name')
        .sort('-createdAt')
        .limit(10);
    }

    res.json({
      success: true,
      user,
      documents,
      postedServices,
      helpedServices,
      ratings,
      clients,
      assignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (bio, skills, profile picture)
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const allowedUpdates = [
      'name', 'phone', 'email', 'ward', 'bio', 'profilePicture', 'skills',
      'languages', 'certifications', 'experience', 'emergencyContact',
      'servicesOffered', 'availability', 'preferences'
    ];
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select('-__v');

    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get list of available helpers (for assignment dropdown)
// @route   GET /api/users/helpers
const getHelpers = async (req, res) => {
  try {
    const helpers = await User.find({
      accountType: 'individual',
      role: { $in: ['helper', 'both'] },
      isActive: true
    }).select('name phone averageRating skills profilePicture');

    res.json({ success: true, count: helpers.length, data: helpers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's badges
// @route   GET /api/users/:userId/badges
const getUserBadges = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('badges');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user.badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate profile completion percentage
// @route   GET /api/users/profile/completion
const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate completion score (max 100)
    let completionScore = 0;
    let maxScore = 0;
    const checklist = {};

    // Required fields
    const requiredFields = ['name', 'phone', 'email', 'ward', 'profilePicture'];
    requiredFields.forEach(field => {
      maxScore += 10;
      if (user[field]) {
        completionScore += 10;
        checklist[field] = true;
      } else {
        checklist[field] = false;
      }
    });

    // Optional but important fields
    const optionalFields = [
      { field: 'bio', points: 8 },
      { field: 'verificationLevel', points: 10, check: (u) => u.verificationLevel > 0 },
      { field: 'idVerified', points: 10 },
      { field: 'skills', points: 8, check: (u) => u.skills && u.skills.length > 0 }
    ];

    optionalFields.forEach(({ field, points, check }) => {
      maxScore += points;
      const isComplete = check ? check(user) : Boolean(user[field]);
      if (isComplete) {
        completionScore += points;
        checklist[field] = true;
      } else {
        checklist[field] = false;
      }
    });

    // Helper-specific fields
    if (user.role === 'helper' || user.role === 'both') {
      const helperFields = [
        { field: 'servicesOffered', points: 12, check: (u) => u.servicesOffered && u.servicesOffered.length > 0 },
        { field: 'languages', points: 8, check: (u) => u.languages && u.languages.length > 0 },
        { field: 'experience', points: 10, check: (u) => u.experience && u.experience.years > 0 },
        { field: 'backgroundCheckStatus', points: 15, check: (u) => u.backgroundCheckStatus === 'approved' }
      ];

      helperFields.forEach(({ field, points, check }) => {
        maxScore += points;
        const isComplete = check ? check(user) : Boolean(user[field]);
        if (isComplete) {
          completionScore += points;
          checklist[field] = true;
        } else {
          checklist[field] = false;
        }
      });
    }

    const percentage = Math.round((completionScore / maxScore) * 100);

    res.json({
      success: true,
      percentage,
      checklist,
      nextSteps: getMissingFields(checklist, user.role)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to suggest next steps
const getMissingFields = (checklist, role) => {
  const suggestions = [];
  
  if (!checklist.profilePicture) suggestions.push('Add a profile picture');
  if (!checklist.email) suggestions.push('Add your email address');
  if (!checklist.bio) suggestions.push('Write a bio about yourself');
  if (!checklist.skills) suggestions.push('Add your skills');
  
  if (role === 'helper' || role === 'both') {
    if (!checklist.servicesOffered) suggestions.push('Select services you offer');
    if (!checklist.languages) suggestions.push('Add languages you speak');
    if (!checklist.experience) suggestions.push('Add your experience');
    if (!checklist.backgroundCheckStatus) suggestions.push('Complete background verification');
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
};

// @desc    Search helpers with advanced filters
// @route   GET /api/users/helpers/search?services=companionship,transportation&languages=English&minRating=4&ward=Ward%201&maxDistance=10
const searchHelpers = async (req, res) => {
  try {
    const {
      services,
      languages,
      minRating,
      ward,
      maxDistance,
      search,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {
      accountType: 'individual',
      role: { $in: ['helper', 'both'] },
      isActive: true
    };

    // Service filter
    if (services) {
      const serviceList = services.split(',').map(s => s.trim());
      filter.servicesOffered = { $in: serviceList };
    }

    // Language filter
    if (languages) {
      const langList = languages.split(',').map(l => l.trim());
      filter.languages = { $in: langList };
    }

    // Minimum rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Ward filter
    if (ward) {
      filter.ward = ward;
    }

    // Search by name or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Fetch helpers
    const helpers = await User.find(filter)
      .select('name phone profilePicture averageRating totalRatings skills servicesOffered languages experience ward bio')
      .sort({ averageRating: -1, totalRatings: -1 })
      .skip(skip)
      .limit(limitNum);

    // Distance filtering (if coordinates available - optional enhancement)
    let filteredHelpers = helpers;
    if (maxDistance) {
      // This would require geo queries - for now, we filter by ward proximity
      // In future, implement MongoDB geospatial queries with coordinates
      filteredHelpers = helpers; // placeholder
    }

    res.json({
      success: true,
      data: filteredHelpers,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile by ID (public view, no sensitive data)
// @route   GET /api/users/:userId
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name phone email ward bio profilePicture averageRating totalRatings accountType role skills badges averageRating servicesOffered languages');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.populate('badges');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFullProfile,
  updateProfile,
  getHelpers,
  getUserBadges,
  getUserById,
  getProfileCompletion,
  searchHelpers
};