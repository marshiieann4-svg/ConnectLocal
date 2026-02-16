// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    userType: {
        type: String,
        enum: ['helper', 'requester', 'both', 'organization'],
        default: 'requester'
    },
    ward: {
        type: String,
        required: [true, 'Ward is required']
    },
    verificationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    idVerified: {
        type: Boolean,
        default: false
    },
    policeClearance: {
        type: Boolean,
        default: false
    },
    skills: [{
        name: String,
        category: String,
        experienceLevel: String
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    communityPoints: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);