const mongoose = require('mongoose');
require('dotenv').config();

// Use the same connection string
const MONGODB_URI = 'mongodb://marshiieann4_db_user:GEvxn4OoE289Aamn@ac-bswcbfh-shard-00-00.yv7g1zb.mongodb.net:27017/connectlocal?ssl=true&authSource=admin&retryWrites=true&w=majority&directConnection=true';
// Your User model here
const User = require('./models/User');

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            family: 4
        });
        console.log('✅ Connected to MongoDB');
        
        // Your seed code here
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

seedDatabase();