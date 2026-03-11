const multer = require('multer');
const path = require('path');
const Verification = require('../models/Verification');
const User = require('../models/User');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter – accept only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
}).single('document'); // field name in form

// Profile picture uploader
const profilePictureUpload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for profile pictures
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) are allowed'));
    }
  }
}).single('profilePicture');

// Upload handler
const uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    try {
      // Save document info to database
      const { userId, documentType } = req.body;
      const documentUrl = `/uploads/${req.file.filename}`; // or full URL
      const doc = await Verification.create({
        userId,
        documentType,
        documentUrl,
        status: 'pending'
      });
      res.status(201).json({ success: true, data: doc, file: req.file });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// Upload profile picture
const uploadProfilePicture = (req, res) => {
  profilePictureUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    try {
      const userId = req.user.id;
      const profilePictureUrl = `/uploads/${req.file.filename}`;
      
      // Update user profile picture
      const user = await User.findByIdAndUpdate(
        userId,
        { profilePicture: profilePictureUrl },
        { new: true }
      ).select('-__v');
      
      res.status(200).json({ 
        success: true, 
        message: 'Profile picture uploaded successfully',
        profilePicture: profilePictureUrl,
        user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

module.exports = { uploadDocument, uploadProfilePicture };