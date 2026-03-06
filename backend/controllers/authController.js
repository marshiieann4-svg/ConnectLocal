// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const {
            phone,
            name,
            email,
            accountType,
            role,
            organizationName,
            registrationNumber,
            ward
        } = req.body;

        // Basic required fields
        if (!phone || !name || !accountType || !ward) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: phone, name, accountType, ward'
            });
        }

        // Validate accountType-specific fields
        if (accountType === 'individual' && !role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required for individual accounts'
            });
        }

        if (accountType !== 'individual' && !organizationName) {
            return res.status(400).json({
                success: false,
                message: 'Organization name is required for organizations/care centres'
            });
        }

        // Check if user exists by phone
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this phone number'
            });
        }

        // Create user with all fields
        const user = await User.create({
            phone,
            name,
            email,
            accountType,
            role: accountType === 'individual' ? role : null,
            organizationName: accountType !== 'individual' ? organizationName : undefined,
            registrationNumber,
            ward,
            verificationLevel: 0,
            // Defaults
            averageRating: 0,
            totalRatings: 0,
            communityPoints: 0
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                accountType: user.accountType,
                role: user.role,
                organizationName: user.organizationName,
                registrationNumber: user.registrationNumber,
                ward: user.ward,
                verificationLevel: user.verificationLevel,
                averageRating: user.averageRating,
                communityPoints: user.communityPoints
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { phone } = req.body;

        // Find user
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                accountType: user.accountType,
                role: user.role,
                organizationName: user.organizationName,
                registrationNumber: user.registrationNumber,
                ward: user.ward,
                verificationLevel: user.verificationLevel,
                averageRating: user.averageRating,
                communityPoints: user.communityPoints
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};