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
    const allowedUpdates = ['name', 'phone', 'email', 'ward', 'bio', 'profilePicture', 'skills'];
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

// @desc    Get user profile by ID (public view, no sensitive data)
// @route   GET /api/users/:userId
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name phone email ward bio profilePicture averageRating totalRatings accountType role skills badges');
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
};