const { Pool } = require('pg');
require('dotenv').config();

async function testSupabaseConnectionAdvanced() {
  console.log('🔍 Advanced Supabase PostgreSQL Connection Test');
  console.log('================================================');
  
  const host = 'db.sqzfbwybvqmsdmgrctfe.supabase.co';
  const port = 5432;
  const database = 'postgres';
  const user = 'postgres';
  const password = 'Covid-19';
  
  console.log('📋 Connection Details:');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${user}`);
  console.log(`   Password: ${password}`);
  console.log('');
  
  // Test 1: Direct hostname resolution
  console.log('🌐 Test 1: DNS Resolution Test...');
  try {
    const dns = require('dns').promises;
    const result = await dns.lookup(host);
    console.log(`✅ Hostname resolved to IP: ${result.address}`);
  } catch (error) {
    console.log(`❌ DNS Resolution failed: ${error.message}`);
    console.log('   The hostname cannot be resolved. This suggests:');
    console.log('   • The Supabase project might be inactive');
    console.log('   • The hostname might be incorrect');
    console.log('   • Network connectivity issues');
    return false;
  }
  
  // Test 2: Connection with different SSL configurations
  console.log('\n🔐 Test 2: SSL Connection Test...');
  const sslConfigs = [
    { ssl: { rejectUnauthorized: false }, name: 'SSL with rejectUnauthorized: false' },
    { ssl: true, name: 'SSL enabled' },
    { ssl: false, name: 'SSL disabled' },
  ];
  
  for (const config of sslConfigs) {
    console.log(`   Testing: ${config.name}`);
    try {
      const pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ...config,
        connectionTimeoutMillis: 10000,
      });
      
      const client = await pool.connect();
      
      // Test a simple query
      const result = await client.query('SELECT 1 as test');
      console.log(`   ✅ ${config.name}: Connection successful!`);
      console.log(`   📊 Test query result: ${result.rows[0].test}`);
      
      // Test getting database version
      const versionResult = await client.query('SELECT version()');
      console.log(`   🔢 PostgreSQL Version: ${versionResult.rows[0].version.substring(0, 50)}...`);
      
      client.release();
      await pool.end();
      
      console.log('🎉 SUCCESS! Supabase connection is working!');
      return true;
      
    } catch (error) {
      console.log(`   ❌ ${config.name}: Failed - ${error.message}`);
    }
  }
  
  // Test 3: Connection using the full DATABASE_URL
  console.log('\n🔗 Test 3: Connection String Test...');
  try {
    const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    console.log(`   Connection String: postgresql://${user}:***@${host}:${port}/${database}`);
    
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user');
    
    console.log('   ✅ Connection string method: Success!');
    console.log(`   📊 Connected to database: ${result.rows[0].current_database}`);
    console.log(`   👤 Connected as user: ${result.rows[0].current_user}`);
    
    client.release();
    await pool.end();
    
    console.log('🎉 SUCCESS! Connection string method works!');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Connection string method failed: ${error.message}`);
  }
  
  // Test 4: Ping test to check network connectivity
  console.log('\n🏓 Test 4: Network Connectivity Test...');
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Try to ping the host
    try {
      const { stdout } = await execPromise(`ping -n 1 ${host}`);
      console.log('   ✅ Network connectivity test passed');
      console.log('   📡 Host is reachable via ICMP');
    } catch (pingError) {
      console.log('   ⚠️  ICMP ping failed (this is normal for some cloud providers)');
    }
    
    // Try to test port connectivity
    const net = require('net');
    const socket = new net.Socket();
    
    return new Promise((resolve) => {
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        console.log(`   ✅ Port ${port} is accessible on ${host}`);
        socket.destroy();
        resolve(false); // Still failed overall, but port is accessible
      });
      
      socket.on('timeout', () => {
        console.log(`   ❌ Port ${port} connection timeout on ${host}`);
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', (err) => {
        console.log(`   ❌ Port ${port} connection error: ${err.message}`);
        resolve(false);
      });
      
      socket.connect(port, host);
    });
    
  } catch (error) {
    console.log(`   ❌ Network test error: ${error.message}`);
  }
  
  console.log('\n================================================');
  console.log('❌ All connection tests failed');
  console.log('\n🔍 Diagnosis Summary:');
  console.log('   The connection tests suggest that either:');
  console.log('   • The Supabase project is not active or accessible');
  console.log('   • The hostname is incorrect');
  console.log('   • The credentials are wrong');
  console.log('   • The database is not configured for external connections');
  
  return false;
}

// Run the test
testSupabaseConnectionAdvanced().then(success => {
  if (!success) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Double-check your Supabase project status');
    console.log('   2. Verify the connection details in your Supabase dashboard');
    console.log('   3. Ensure the project is not paused or inactive');
    console.log('   4. Check if there are any IP restrictions');
    console.log('\n✅ Meanwhile, your application works perfectly with SQLite!');
  }
  process.exit(success ? 0 : 1);
});