const mongoose = require('mongoose');

// 🔴 YOUR CONNECTION STRING (exactly as you have it)
const MONGODB_URI = "mongodb://marshiieann4_db_user:GEvxn4OoE289Aamn@ac-bswcbfh-shard-00-00.yv7g1zb.mongodb.net:27017,ac-bswcbfh-shard-00-01.yv7g1zb.mongodb.net:27017,ac-bswcbfh-shard-00-02.yv7g1zb.mongodb.net:27017/connectlocal?ssl=true&replicaSet=atlas-bswcbfh-shard-0&authSource=admin&retryWrites=true&w=majority";

async function testConnection() {
    console.log('='.repeat(60));
    console.log('🔬 TESTING MONGODB CONNECTION - ENHANCED');
    console.log('='.repeat(60));
    
    const hiddenURI = MONGODB_URI.replace(/:[^:]*@/, ':****@');
    console.log('📍 Connection String:', hiddenURI);
    console.log('📍 Node Version:', process.version);
    console.log('📍 Mongoose Version:', mongoose.version);
    console.log('='.repeat(60));
    
    try {
        console.log('⏳ Connecting with enhanced options...');
        
        const conn = await mongoose.connect(MONGODB_URI, {
            // CRITICAL: These options help with Atlas connections
            serverSelectionTimeoutMS: 30000,     // Wait 30 seconds (was 10000)
            socketTimeoutMS: 45000,               // Keep socket open 45 seconds
            connectTimeoutMS: 30000,              // Wait 30 seconds to connect
            heartbeatFrequencyMS: 10000,          // Check every 10 seconds
            retryWrites: true,
            retryReads: true,
            
            // Force IPv4
            family: 4,
            
            // Pool size
            maxPoolSize: 10,
            minPoolSize: 2,
            
            // SSL options
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            
            // Debug
            autoIndex: true
        });
        
        console.log('\n✅✅✅ CONNECTION SUCCESSFUL! ✅✅✅');
        console.log(`📍 Host: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔄 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        
        // Test the connection
        const admin = conn.connection.db.admin();
        const info = await admin.serverInfo();
        console.log(`📍 MongoDB Version: ${info.version}`);
        
        // List collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log(`📚 Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'No collections yet'}`);
        
        // Insert a test document
        const testCollection = conn.connection.db.collection('connection_test');
        const result = await testCollection.insertOne({
            test: 'Connection successful',
            timestamp: new Date(),
            nodeVersion: process.version
        });
        console.log(`✅ Test document inserted with ID: ${result.insertedId}`);
        
        await mongoose.disconnect();
        console.log('👋 Disconnected');
        
    } catch (error) {
        console.error('\n❌❌❌ CONNECTION FAILED! ❌❌❌');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
        
        // Detailed troubleshooting
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Check if your IP is whitelisted in Atlas (0.0.0.0/0)');
        console.log('2. Verify network: Test-NetConnection ac-bswcbfh-shard-00-00.yv7g1zb.mongodb.net -Port 27017');
        console.log('3. Try disabling Windows Firewall temporarily');
        console.log('4. Check if your ISP is blocking port 27017');
        console.log('5. Try connecting from a different network (mobile hotspot)');
    }
}

testConnection();