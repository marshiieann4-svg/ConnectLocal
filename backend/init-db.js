const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
// You'll add more models later: Service, Rating, etc.

async function initDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create collections by ensuring models exist
        // This will create the 'users' collection if it doesn't exist
        await User.createCollection();
        console.log('✅ Users collection ready');

        // You can add indexes here if needed
        await User.collection.createIndex({ phone: 1 }, { unique: true });
        console.log('✅ Indexes created');

        console.log('🎉 Database initialization complete');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

initDB();