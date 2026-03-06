const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { awardPointsEndpoint, getUserPoints, getLeaderboard } = require('../controllers/gamificationController');

// Admin only – award points manually (for testing)
router.post('/award', protect, admin, awardPointsEndpoint);

// Get user's point history
router.get('/user/:userId', protect, getUserPoints);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

module.exports = router;