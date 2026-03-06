// scripts/seedBadges.js
const mongoose = require('mongoose');
const Badge = require('../models/Badge');
require('dotenv').config();

const badges = [
  // Service count badges
  { name: 'Garden Guru', description: 'Completed 10 gardening jobs', icon: 'fas fa-seedling', category: 'service', criteria: { type: 'count', value: 10, serviceCategory: 'gardening' } },
  { name: 'Homework Hero', description: 'Completed 10 tutoring jobs', icon: 'fas fa-book', category: 'service', criteria: { type: 'count', value: 10, serviceCategory: 'tutoring' } },
  { name: 'Care Champion', description: 'Completed 20 elderly care jobs', icon: 'fas fa-heart', category: 'service', criteria: { type: 'count', value: 20, serviceCategory: 'elderly_care' } },
  { name: 'Handy Helper', description: 'Completed 10 repair jobs', icon: 'fas fa-tools', category: 'service', criteria: { type: 'count', value: 10, serviceCategory: 'repairs' } },
  { name: 'Rising Star', description: 'Completed 5 services', icon: 'fas fa-star', category: 'service', criteria: { type: 'count', value: 5 } },
  { name: 'Super Helper', description: 'Completed 50 services', icon: 'fas fa-crown', category: 'service', criteria: { type: 'count', value: 50 } },

  // Rating badges
  { name: 'Trusted Helper', description: 'Average rating of 4.5+', icon: 'fas fa-check-circle', category: 'rating', criteria: { type: 'rating', value: 4.5 } },
  { name: 'Community Favorite', description: 'Average rating of 5.0', icon: 'fas fa-medal', category: 'rating', criteria: { type: 'rating', value: 5.0 } },

  // Points badges
  { name: 'Point Collector', description: 'Earned 100 points', icon: 'fas fa-coins', category: 'points', criteria: { type: 'points', value: 100 } },
  { name: 'High Roller', description: 'Earned 500 points', icon: 'fas fa-gem', category: 'points', criteria: { type: 'points', value: 500 } },
];

const seedBadges = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const badge of badges) {
      await Badge.findOneAndUpdate(
        { name: badge.name },
        badge,
        { upsert: true, new: true }
      );
    }
    console.log('Badges seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding badges:', error);
    process.exit(1);
  }
};

seedBadges();