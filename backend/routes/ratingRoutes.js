const express = require('express');
const router = express.Router();
const { createRating, getUserRatings, getServiceRating } = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createRating);
router.get('/user/:userId', getUserRatings);
router.get('/service/:serviceId', getServiceRating);

module.exports = router;