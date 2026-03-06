const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// FIX 1: Explicitly set DNS servers (bypasses Windows DNS issues) [citation:3]
console.log('🔧 Setting DNS servers to Cloudflare (1.1.1.1) and Google (8.8.8.8)...');
dns.setServers(['1.1.1.1', '8.8.8.8']);

// FIX 2: Use Standard Connection String (not SRV) [citation:5][citation:7]
// Replace this with your actual standard string from Atlas
const STANDARD_URI = "mongodb://marshiieann4_db_user:GEvxn4OoE289Aamn@ac-bswcbfh-shard-00-00.yv7g1zb.mongodb.net:27017,ac-bswcbfh-shard-00-01.yv7g1zb.mongodb.net:27017,ac-bswcbfh-shard-00-02.yv7g1zb.mongodb.net:27017/connectlocal?ssl=true&replicaSet=atlas-bswcbfh-shard-0&authSource=admin&retryWrites=true&w=majority";

async function testFixedConnection() {
    console.log('='.repeat(60));
    console.log('🔬 TESTING FIXED CONNECTION METHOD');
    console.log('='.repeat(60));
    
    try {
        console.log('⏳ Attempting connection with Standard URI...');
        
        await mongoose.connect(STANDARD_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        
        console.log('✅✅✅ CONNECTION SUCCESSFUL!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('📍 Host:', mongoose.connection.host);
        
        await mongoose.disconnect();
        console.log('👋 Disconnected cleanly');
        
    } catch (error) {
        console.error('❌❌❌ CONNECTION FAILED!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

testFixedConnection();