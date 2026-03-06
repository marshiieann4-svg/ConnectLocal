const express = require('express');
const router = express.Router();
const { uploadDocument, submitReference, verifyDocument } = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');

router.post('/upload', protect, uploadDocument);
router.post('/reference', protect, submitReference);
router.put('/:id/verify', protect, verifyDocument); // admin only – add admin middleware later

module.exports = router;