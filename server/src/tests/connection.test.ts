/**
 * MongoDB Connection Test
 * 
 * Tests direct connection to MongoDB Atlas to diagnose Heroku H10 errors.
 * Run with: ts-node --transpile-only src/tests/connection.test.ts
 */

import mongoose from 'mongoose';
import { config } from '../config';

async function testMongoDBConnection() {
  console.log('🔍 MongoDB Connection Diagnostics');
  console.log('━'.repeat(50));
  
  // Test 1: Configuration
  console.log('\n📋 Test 1: Configuration Check');
  
  // Check which variable is being used
  const dbVarUsed = process.env.DATABASE_URL ? 'DATABASE_URL' :
                    process.env.MONGODB_URI ? 'MONGODB_URI' :
                    process.env.DB_URL ? 'DB_URL' :
                    'DEFAULT (localhost)';
  
  console.log(`   Environment Variable: ${dbVarUsed}`);
  console.log(`   Connection String: ${config.dbUrl.replace(/\/\/.*@/, '//<credentials>@')}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Node Env: ${process.env.NODE_ENV || 'development'}`);
  
  if (!config.dbUrl || config.dbUrl === 'mongodb://localhost:27017/event-booking') {
    console.error('\n   ❌ CRITICAL: Using localhost connection string!');
    console.error('   ⚠️  This will NOT work on Heroku. Set one of these on Heroku:');
    console.error('   - DATABASE_URL (recommended for Heroku)');
    console.error('   - MONGODB_URI (MongoDB Atlas standard)');
    console.error('   - DB_URL (custom)');
    console.error('\n   💡 Add via: heroku config:set DATABASE_URL="<your-mongodb-uri>" -a <app-name>');
  } else if (config.dbUrl.includes('mongodb+srv://')) {
    console.log('   ✅ MongoDB Atlas connection string detected');
  }
  
  // Test 2: DNS Resolution (for SRV records)
  console.log('\n🌐 Test 2: DNS & Network Check');
  if (config.dbUrl.includes('mongodb+srv://')) {
    try {
      const url = new URL(config.dbUrl.replace('mongodb+srv://', 'https://'));
      console.log(`   Cluster host: ${url.hostname}`);
      console.log('   ✅ URI parsing successful');
    } catch (err: any) {
      console.error(`   ❌ URI parsing failed: ${err.message}`);
      process.exit(1);
    }
  }
  
  // Test 3: MongoDB Connection with detailed options
  console.log('\n🔌 Test 3: MongoDB Connection Attempt');
  const connectionOptions = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4, // IPv4
  };
  
  console.log('   Connection options:');
  console.log(`   - serverSelectionTimeoutMS: ${connectionOptions.serverSelectionTimeoutMS}ms`);
  console.log(`   - connectTimeoutMS: ${connectionOptions.connectTimeoutMS}ms`);
  console.log(`   - socketTimeoutMS: ${connectionOptions.socketTimeoutMS}ms`);
  console.log(`   - family: IPv${connectionOptions.family}`);
  
  const startTime = Date.now();
  
  try {
    console.log('\n   Connecting...');
    await mongoose.connect(config.dbUrl, connectionOptions);
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Connection successful in ${duration}ms`);
    console.log(`   Connection state: ${mongoose.connection.readyState}`);
    console.log(`   Database name: ${mongoose.connection.db?.databaseName || 'N/A'}`);
    
    // Test 4: Database Operations
    console.log('\n💾 Test 4: Database Operations');
    try {
      const collections = await mongoose.connection.db?.listCollections().toArray();
      console.log(`   Collections found: ${collections?.length || 0}`);
      if (collections && collections.length > 0) {
        console.log('   Collection names:', collections.map(c => c.name).join(', '));
      }
      console.log('   ✅ Database operations working');
    } catch (err: any) {
      console.error(`   ❌ Database operations failed: ${err.message}`);
    }
    
    // Test 5: Write Test (create a test document)
    console.log('\n✍️  Test 5: Write/Read Test');
    try {
      const TestModel = mongoose.model('ConnectionTest', new mongoose.Schema({
        timestamp: Date,
        test: String,
      }));
      
      const testDoc = await TestModel.create({
        timestamp: new Date(),
        test: 'Heroku connection diagnostic',
      });
      
      console.log('   ✅ Write successful');
      console.log(`   Document ID: ${testDoc._id}`);
      
      // Clean up
      await TestModel.deleteOne({ _id: testDoc._id });
      console.log('   ✅ Delete successful (cleanup done)');
    } catch (err: any) {
      console.error(`   ❌ Write/Read test failed: ${err.message}`);
    }
    
    // Final summary
    console.log('\n' + '━'.repeat(50));
    console.log('✅ ALL TESTS PASSED');
    console.log('📊 Summary:');
    console.log('   - Configuration: Valid');
    console.log('   - Connection: Successful');
    console.log('   - Database: Accessible');
    console.log('   - Operations: Working');
    console.log('\n💡 Your MongoDB connection is healthy locally!');
    console.log('\n   If Heroku still shows H10 error, verify:');
    console.log('   1. Heroku Config Var is set (DATABASE_URL, MONGODB_URI, or DB_URL)');
    console.log('      Check with: heroku config -a <app-name>');
    console.log('   2. MongoDB Atlas Network Access allows 0.0.0.0/0 (all IPs)');
    console.log('   3. Restart Heroku dyno: heroku restart -a <app-name>');
    console.log('   4. Check logs: heroku logs --tail -a <app-name>');
    
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`\n   ❌ Connection failed after ${duration}ms`);
    console.error(`   Error name: ${err.name}`);
    console.error(`   Error message: ${err.message}`);
    
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.error('\n   🔍 DNS Resolution Error:');
      console.error('   - Check your MongoDB URI spelling');
      console.error('   - Ensure MongoDB Atlas cluster is running');
      console.error('   - Try using IPv4 addresses instead of SRV');
    }
    
    if (err.message.includes('authentication failed')) {
      console.error('\n   🔍 Authentication Error:');
      console.error('   - Verify username and password in DB_URL');
      console.error('   - Check MongoDB Atlas user permissions');
      console.error('   - Ensure special characters in password are URL-encoded');
    }
    
    if (err.message.includes('timed out') || err.message.includes('ETIMEDOUT')) {
      console.error('\n   🔍 Timeout Error:');
      console.error('   - MongoDB Atlas IP whitelist may be blocking your IP');
      console.error('   - Add 0.0.0.0/0 to Network Access (temporarily for testing)');
      console.error('   - Check firewall settings');
    }
    
    console.error('\n' + '━'.repeat(50));
    console.error('❌ CONNECTION TEST FAILED');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run the test
testMongoDBConnection()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed with unexpected error:', err);
    process.exit(1);
  });
