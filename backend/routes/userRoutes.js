const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
getFullProfile, 
updateProfile, 
getHelpers, 
getUserBadges,
getUserById   // <-- add this
} = require('../controllers/userController');

router.get('/profile', protect, getFullProfile);
router.put('/profile', protect, updateProfile);
router.get('/helpers', protect, getHelpers);
router.get('/:userId/badges', protect, getUserBadges);
router.get('/:userId', protect, getUserById);

module.exports = router;