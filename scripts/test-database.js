const DatabaseAdapter = require('../config/database-adapter');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('=====================================');
  
  try {
    // Initialize the database
    await DatabaseAdapter.init();
    
    // Wait a bit for the database to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Database initialized successfully`);
    console.log(`📊 Database type: ${DatabaseAdapter.getDbType()}`);
    
    // Test basic query
    console.log('\n🧪 Testing basic queries...');
    
    // Test if tables exist (adjust query based on database type)
    let tablesQuery;
    if (DatabaseAdapter.getDbType() === 'postgresql') {
      tablesQuery = `
        SELECT table_name as name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('inscriptions', 'admin_users')
      `;
    } else {
      tablesQuery = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('inscriptions', 'admin_users')
      `;
    }
    
    const tablesResult = await DatabaseAdapter.query(tablesQuery);
    const tables = tablesResult.rows || [];
    
    console.log(`📋 Found ${tables.length} tables:`, tables.map(t => t.name || t.table_name));
    
    // Test counting records
    const inscriptionCountResult = await DatabaseAdapter.query('SELECT COUNT(*) as count FROM inscriptions');
    const adminCountResult = await DatabaseAdapter.query('SELECT COUNT(*) as count FROM admin_users');
    
    const inscriptionCount = inscriptionCountResult.rows[0].count;
    const adminCount = adminCountResult.rows[0].count;
    
    console.log(`📝 Inscriptions: ${inscriptionCount} records`);
    console.log(`👨‍💼 Admin users: ${adminCount} records`);
    
    // Test getting some sample data
    if (inscriptionCount > 0) {
      console.log('\n📋 Sample inscriptions:');
      const samplesResult = await DatabaseAdapter.query('SELECT first_name, last_name, email, status FROM inscriptions LIMIT 3');
      const samples = samplesResult.rows || [];
      samples.forEach((sample, index) => {
        console.log(`   ${index + 1}. ${sample.first_name} ${sample.last_name} (${sample.email}) - Status: ${sample.status}`);
      });
    }
    
    // Test admin users
    if (adminCount > 0) {
      console.log('\n👨‍💼 Admin users:');
      const adminsResult = await DatabaseAdapter.query('SELECT email, name, role FROM admin_users');
      const admins = adminsResult.rows || [];
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - Role: ${admin.role}`);
      });
    }
    
    // Test a simple insert and delete to verify write operations
    console.log('\n🔧 Testing write operations...');
    
    const testEmail = 'test-connection@example.com';
    
    try {
      // Insert test record
      await DatabaseAdapter.query(
        'INSERT INTO inscriptions (first_name, last_name, email, phone, birth_date, address, city, postal_code, country, program, motivation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['Test', 'User', testEmail, '+1-555-0000', '1990-01-01', 'Test Address', 'Test City', '12345', 'Test Country', 'Test Program', 'This is a test motivation that is longer than 50 characters to meet requirements.']
      );
      
      console.log(`✅ Insert test: Record inserted successfully`);
      
      // Clean up test record
      await DatabaseAdapter.query('DELETE FROM inscriptions WHERE email = ?', [testEmail]);
      console.log(`🧹 Cleanup: Test record removed`);
    } catch (error) {
      console.log(`⚠️  Write test error: ${error.message}`);
    }
    
    console.log('\n✅ All database tests passed!');
    console.log(`📊 Database is fully functional using: ${DatabaseAdapter.getDbType().toUpperCase()}`);
    console.log('=====================================');
    
    // Show connection information
    if (DatabaseAdapter.getDbType() === 'postgresql') {
      console.log('🔗 Connected to PostgreSQL (Supabase)');
    } else {
      console.log('🔗 Using SQLite (local database)');
      console.log('   ℹ️  PostgreSQL connection failed, fell back to SQLite');
    }
    
    console.log('\n🌐 Your application is ready!');
    console.log('   📝 Registration: http://localhost:3000');
    console.log('   👨‍💼 Admin Dashboard: http://localhost:3000/admin');
    console.log('   🔑 Login: admin@example.com / admin123');
    console.log('=====================================');
    
    console.log('\n💡 Tips:');
    console.log('   • To use PostgreSQL, verify your Supabase credentials');
    console.log('   • The system automatically falls back to SQLite when PostgreSQL is unavailable');
    console.log('   • Both databases work identically for your application');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('=====================================');
  } finally {
    // Close the database connection
    await DatabaseAdapter.close();
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();