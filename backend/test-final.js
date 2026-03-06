const { MongoClient } = require('mongodb');

const uri = "mongodb://marshiieann4_db_user:GEvxn4OoE289Aamn@ac-bswcbfh-shard-00-00.yv7g1zb.mongodb.net:27017/connectlocal?ssl=true&authSource=admin&retryWrites=true&w=majority&directConnection=true";
async function testNative() {
    console.log('Testing with native MongoDB driver...');
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000
    });
    
    try {
        await client.connect();
        console.log('✅ NATIVE DRIVER CONNECTED!');
        await client.db('connectlocal').command({ ping: 1 });
        console.log('✅ Ping successful');
        await client.close();
    } catch (err) {
        console.error('❌ Native driver failed:', err.message);
    }
}

testNative();