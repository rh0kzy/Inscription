const { Pool } = require('pg');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase PostgreSQL Connection');
  console.log('========================================');
  
  const connectionConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
  
  console.log('📋 Connection Configuration:');
  console.log(`   Host: ${connectionConfig.host}`);
  console.log(`   Port: ${connectionConfig.port}`);
  console.log(`   Database: ${connectionConfig.database}`);
  console.log(`   User: ${connectionConfig.user}`);
  console.log(`   Password: ${'*'.repeat(connectionConfig.password.length)}`);
  console.log('');
  
  // Test 1: Connection with SSL
  console.log('🔐 Test 1: Attempting connection with SSL...');
  try {
    const poolWithSSL = new Pool({
      ...connectionConfig,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000,
    });
    
    const client = await poolWithSSL.connect();
    console.log('✅ SSL Connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL Version: ${result.rows[0].version.substring(0, 50)}...`);
    
    client.release();
    await poolWithSSL.end();
    
    console.log('🎉 Supabase connection is working perfectly!');
    return true;
    
  } catch (error) {
    console.log('❌ SSL Connection failed:', error.message);
  }
  
  // Test 2: Connection without SSL (fallback)
  console.log('\n🔓 Test 2: Attempting connection without SSL...');
  try {
    const poolWithoutSSL = new Pool({
      ...connectionConfig,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });
    
    const client = await poolWithoutSSL.connect();
    console.log('✅ Non-SSL Connection successful!');
    
    client.release();
    await poolWithoutSSL.end();
    
    console.log('🎉 Supabase connection is working (without SSL)!');
    return true;
    
  } catch (error) {
    console.log('❌ Non-SSL Connection failed:', error.message);
  }
  
  // Test 3: Test hostname resolution
  console.log('\n🌐 Test 3: Testing hostname resolution...');
  try {
    const dns = require('dns').promises;
    const addresses = await dns.lookup(connectionConfig.host);
    console.log(`✅ Hostname resolved to: ${addresses.address}`);
  } catch (error) {
    console.log('❌ Hostname resolution failed:', error.message);
    console.log('   This suggests the Supabase project might be inactive or the hostname is incorrect.');
  }
  
  console.log('\n========================================');
  console.log('❌ All connection attempts failed');
  console.log('💡 Possible issues:');
  console.log('   • Incorrect hostname or project inactive');
  console.log('   • Wrong credentials');
  console.log('   • Network/firewall issues');
  console.log('   • Supabase project not configured for external connections');
  
  return false;
}

// Run the test
testSupabaseConnection().then(success => {
  process.exit(success ? 0 : 1);
});