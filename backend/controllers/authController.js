// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const normalizeType = (value, fallback = '') => String(value || fallback).toLowerCase();

const buildAuthUser = (user) => {
    const accountType = normalizeType(user.accountType);
    const userType = normalizeType(user.userType);
    const role = normalizeType(user.role);

    const resolvedAccountType = accountType === 'admin' || userType === 'admin' || role === 'admin'
        ? 'admin'
        : accountType || userType || 'individual';

    return {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        accountType: resolvedAccountType,
        userType: user.userType || user.accountType || null,
        role: user.role,
        organizationName: user.organizationName,
        registrationNumber: user.registrationNumber,
        ward: user.ward,
        verificationLevel: user.verificationLevel,
        averageRating: user.averageRating,
        communityPoints: user.communityPoints
    };
};

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

        const organizationTypes = ['organization', 'home_care', 'dropin_centre'];

        if (organizationTypes.includes(accountType) && !organizationName) {
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
            organizationName: organizationTypes.includes(accountType) ? organizationName : undefined,
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
            user: buildAuthUser(user)
        });

    } catch (error) {
        console.error('Registration error details:', {
            message: error.message,
            code: error.code,
            keys: error.keyValue,
            errors: error.errors
        });
        
        // Duplicate phone number
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }
        
        // Validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
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
            user: buildAuthUser(user)
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