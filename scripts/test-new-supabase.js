const { Pool } = require('pg');
require('dotenv').config();

async function testNewSupabaseConnection() {
  console.log('🔍 Testing New Supabase PostgreSQL Connection');
  console.log('==============================================');
  
  const host = 'aws-1-eu-west-3.pooler.supabase.com';
  const port = 5432;
  const database = 'postgres';
  const user = 'postgres.sqzfbwybvqmsdmgrctfe';
  const password = 'Covid-19';
  
  console.log('📋 Connection Details:');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${user}`);
  console.log(`   Password: ${password}`);
  console.log(`   Pool Mode: session`);
  console.log('');
  
  // Test 1: DNS Resolution
  console.log('🌐 Test 1: DNS Resolution...');
  try {
    const dns = require('dns').promises;
    const result = await dns.lookup(host);
    console.log(`✅ Hostname resolved to IP: ${result.address}`);
  } catch (error) {
    console.log(`❌ DNS Resolution failed: ${error.message}`);
    return false;
  }
  
  // Test 2: PostgreSQL Connection
  console.log('\n🔐 Test 2: PostgreSQL Connection...');
  try {
    const pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
    
    console.log('   🔗 Connecting to Supabase PostgreSQL...');
    const client = await pool.connect();
    
    // Test basic query
    console.log('   📝 Testing basic query...');
    const result = await client.query('SELECT 1 as test, current_database(), current_user, version()');
    
    console.log('✅ SUCCESS! Connected to Supabase PostgreSQL!');
    console.log(`   📊 Test query result: ${result.rows[0].test}`);
    console.log(`   🏠 Database: ${result.rows[0].current_database}`);
    console.log(`   👤 User: ${result.rows[0].current_user}`);
    console.log(`   🔢 Version: ${result.rows[0].version.substring(0, 50)}...`);
    
    // Test table creation
    console.log('\n🏗️  Test 3: Table Creation Test...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert test data
    await client.query(`
      INSERT INTO test_connection (message) 
      VALUES ('Connection test successful at ' || CURRENT_TIMESTAMP)
    `);
    
    // Read test data
    const testResult = await client.query('SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1');
    console.log(`   ✅ Table operations successful: ${testResult.rows[0].message}`);
    
    // Cleanup
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log('   🧹 Test cleanup completed');
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 ALL TESTS PASSED! Supabase PostgreSQL is working perfectly!');
    return true;
    
  } catch (error) {
    console.log(`❌ PostgreSQL connection failed: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Connection refused - check if the host and port are correct');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 Host not found - check the hostname');
    } else if (error.message.includes('authentication')) {
      console.log('   💡 Authentication failed - check username and password');
    }
    return false;
  }
}

// Test using environment variables
async function testWithEnvVars() {
  console.log('\n🔧 Test 4: Using Environment Variables...');
  
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log(`   Connection String: ${connectionString.replace(/:[^@]+@/, ':***@')}`);
    
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT current_database() as db, current_user as user');
    
    console.log('   ✅ Environment variable connection successful!');
    console.log(`   📊 Connected to: ${result.rows[0].db} as ${result.rows[0].user}`);
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Environment variable connection failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const test1 = await testNewSupabaseConnection();
  const test2 = await testWithEnvVars();
  
  if (test1 && test2) {
    console.log('\n🌟 EXCELLENT! Your Supabase PostgreSQL connection is fully configured!');
    console.log('   Your application will now use the online database instead of SQLite.');
  } else {
    console.log('\n❌ Some tests failed. Please check your Supabase credentials.');
  }
  
  return test1 && test2;
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});