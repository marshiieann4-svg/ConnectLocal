const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('🔍 Attempting to connect to MongoDB...');
        console.log('📍 URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // ⚡ CRITICAL: Increase timeouts
            serverSelectionTimeoutMS: 30000,  // 30 seconds (was 5000)
            socketTimeoutMS: 45000,            // 45 seconds
            connectTimeoutMS: 30000,           // 30 seconds
            heartbeatFrequencyMS: 10000,       // Check every 10 seconds
            
            // 🔐 TLS/SSL settings for Atlas
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            
            // 🌐 Force IPv4
            family: 4,
            
            // 📦 Connection pool
            maxPoolSize: 10,
            minPoolSize: 2,
            
            // 🔄 Retry settings
            retryWrites: true,
            retryReads: true
        });
        
        console.log('\n✅ MongoDB Connected Successfully!');
        console.log(`📍 Host: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔄 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('\n❌ MongoDB Connection Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
        console.error('\n');
        
        // Retry logic
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;