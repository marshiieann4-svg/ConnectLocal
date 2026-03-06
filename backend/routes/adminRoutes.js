const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { getPendingDocuments, verifyDocument, rejectDocument } = require('../controllers/verificationController');

router.get('/documents/pending', protect, admin, getPendingDocuments);
router.put('/documents/:id/verify', protect, admin, verifyDocument);
router.put('/documents/:id/reject', protect, admin, rejectDocument);

module.exports = router;