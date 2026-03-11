const express = require('express');
const router = express.Router();
const { uploadDocument, uploadProfilePicture } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

router.post('/', protect, uploadDocument);
router.post('/profile-picture', protect, uploadProfilePicture);

module.exports = router;