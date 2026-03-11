const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getFullProfile, 
  updateProfile, 
  getHelpers, 
  getUserBadges,
  getUserById,
  getProfileCompletion,
  searchHelpers
} = require('../controllers/userController');

router.get('/profile', protect, getFullProfile);
router.put('/profile', protect, updateProfile);
router.get('/profile/completion', protect, getProfileCompletion);
router.get('/helpers', protect, getHelpers);
router.get('/helpers/search', searchHelpers); // public search
router.get('/:userId/badges', protect, getUserBadges);
router.get('/:userId', protect, getUserById);

module.exports = router;