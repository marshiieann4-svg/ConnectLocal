const Rating = require('../models/Rating');
const User = require('../models/User');
const { awardPoints, checkAndAwardBadges } = require('./gamificationController'); // adjust path if needed

// @desc    Create a rating
// @route   POST /api/ratings
const createRating = async (req, res) => {
  try {
    const rating = await Rating.create(req.body);

    // Update the rated user's average rating
    const ratings = await Rating.find({ ratedId: req.body.ratedId });
    const avg = ratings.reduce((acc, r) => acc + r.overall, 0) / ratings.length;
    await User.findByIdAndUpdate(req.body.ratedId, { averageRating: avg, totalRatings: ratings.length });

    // Award points if rating is 5 stars
    if (rating.overall === 5) {
      await awardPoints(
        req.body.ratedId,
        25,
        'Received a 5-star rating',
        rating._id
      );
      await checkAndAwardBadges(req.body.ratedId);
    }

    res.status(201).json({ success: true, data: rating });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


const getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedId: req.params.userId })
      .populate('raterId', 'name phone')
      .populate('serviceId', 'title');
    res.json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServiceRating = async (req, res) => {
  try {
    const ratings = await Rating.find({ serviceId: req.params.serviceId })
      .populate('raterId', 'name');
    res.json({ success: true, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRating, getUserRatings, getServiceRating };