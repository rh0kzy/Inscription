const { Pool } = require('pg');

// Test connection with the provided credentials
const pool = new Pool({
  host: 'db.pssxppgtoliwdvyhiftx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'test123',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  console.log('🔧 Testing Supabase PostgreSQL connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Supabase PostgreSQL!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📅 Server time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version);
    
    client.release();
    await pool.end();
    
    console.log('');
    console.log('🎉 Connection test successful!');
    console.log('The database credentials are working correctly.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('');
    console.error('📋 Please check:');
    console.error('1. Supabase host: db.pssxppgtoliwdvyhiftx.supabase.co');
    console.error('2. Database name: postgres');
    console.error('3. Username: postgres');
    console.error('4. Password: test123');
    console.error('5. Port: 5432');
    console.error('6. Internet connection');
    console.error('7. Supabase project status');
  }
}

testConnection();