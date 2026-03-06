const Verification = require('../models/Verification');
const Reference = require('../models/Reference');
const User = require('../models/User');

const uploadDocument = async (req, res) => {
  try {
    const { userId, documentType, documentUrl } = req.body;
    const doc = await Verification.create({ userId, documentType, documentUrl });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const submitReference = async (req, res) => {
  try {
    const ref = await Reference.create(req.body);
    res.status(201).json({ success: true, data: ref });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all pending documents (admin only)
const getPendingDocuments = async (req, res) => {
  try {
    const docs = await Verification.find({ status: 'pending' })
      .populate('userId', 'name phone email')
      .sort('-createdAt');
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject a document (admin only)
const rejectDocument = async (req, res) => {
  try {
    const doc = await Verification.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    }, { new: true });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Helper function to recalculate user's verification level based on verified documents
const updateUserVerificationLevel = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const idVerified = await Verification.findOne({ userId, documentType: 'id', status: 'verified' });
  const policeVerified = await Verification.findOne({ userId, documentType: 'police_clearance', status: 'verified' });
  const addressVerified = await Verification.findOne({ userId, documentType: 'proof_of_address', status: 'verified' });
  // Add more document types as needed

  let level = 0;
  if (idVerified) level = 1;
  if (policeVerified) level = 2;
  if (addressVerified) level = 3; // etc.

  user.verificationLevel = level;
  await user.save();
};

// Modify verifyDocument to call the update function
const verifyDocument = async (req, res) => {
  try {
    const doc = await Verification.findByIdAndUpdate(req.params.id, {
      status: 'verified',
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    }, { new: true });

    // Update user's verification level based on all verified docs
    await updateUserVerificationLevel(doc.userId);

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { 
  uploadDocument, 
  submitReference, 
  verifyDocument, 
  getPendingDocuments, 
  rejectDocument 
};