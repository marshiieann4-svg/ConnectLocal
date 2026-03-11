const mongoose = require('mongoose');
const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Rating = require('../models/Rating');
const Service = require('../models/Service');

// Award points to a user and record transaction
const awardPoints = async (userId, points, reason, relatedId = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Update user's points
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points } },
      { new: true, session }
    );
    // Create transaction record
    await PointTransaction.create([{
      userId,
      points,
      reason,
      relatedId
    }], { session });
    await session.commitTransaction();
    session.endSession();
    return user;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Check and award badges based on user's stats
const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId).populate('badges');
  const userBadgeIds = user.badges.map(b => b._id.toString());

  // Get all badges
  const allBadges = await Badge.find();

  for (const badge of allBadges) {
    if (userBadgeIds.includes(badge._id.toString())) continue; // already have it

    let earned = false;
    switch (badge.criteria.type) {
      case 'count':
        // Count of services completed in a category
        const query = { helperId: userId, status: 'completed' };
        if (badge.criteria.serviceCategory) {
          query.category = badge.criteria.serviceCategory;
        }
        const count = await Service.countDocuments(query);
        earned = count >= badge.criteria.value;
        break;
      case 'rating':
        // Average rating >= value
        const ratings = await Rating.find({ ratedId: userId });
        if (ratings.length === 0) break;
        const avg = ratings.reduce((acc, r) => acc + r.overall, 0) / ratings.length;
        earned = avg >= badge.criteria.value;
        break;
      case 'points':
        earned = user.points >= badge.criteria.value;
        break;
    }

    if (earned) {
      user.badges.push(badge._id);
    }
  }

  if (user.isModified('badges')) {
    await user.save();
  }
};

// Endpoint to manually award points (admin only)
const awardPointsEndpoint = async (req, res) => {
  try {
    const { userId, points, reason, relatedId } = req.body;
    const user = await awardPoints(userId, points, reason, relatedId);
    await checkAndAwardBadges(userId);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's point history
const getUserPoints = async (req, res) => {
  try {
    const transactions = await PointTransaction.find({ userId: req.params.userId }).sort('-createdAt');
    const user = await User.findById(req.params.userId).select('points');
    res.json({ success: true, points: user.points, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get leaderboard (with optional period and ward filter)
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', ward } = req.query;
    const escapedWard = String(ward || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wardRegex = escapedWard ? new RegExp(escapedWard, 'i') : null;

    // All-time leaderboard should always be available even before any transactions exist.
    if (period === 'all') {
      const query = { isActive: true };
      if (wardRegex) query.ward = wardRegex;

      const users = await User.find(query)
        .select('name phone points ward profilePicture')
        .sort({ points: -1, createdAt: 1 })
        .limit(50)
        .lean();

      const normalized = users.map((user) => ({
        ...user,
        points: Number(user.points || 0)
      }));

      return res.json({ success: true, data: normalized });
    }

    let dateFilter = {};
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    const leaderboard = await PointTransaction.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.isActive': true, ...(wardRegex ? { 'user.ward': wardRegex } : {}) } },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          phone: '$user.phone',
          points: '$totalPoints',
          ward: '$user.ward',
          profilePicture: '$user.profilePicture'
        }
      },
      { $sort: { points: -1 } },
      { $limit: 50 }
    ]);

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  awardPoints,
  checkAndAwardBadges,
  awardPointsEndpoint,
  getUserPoints,
  getLeaderboard
};