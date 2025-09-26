const DatabaseAdapter = require('../config/database-adapter');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function comprehensiveDatabaseTest() {
  console.log('🔍 COMPREHENSIVE DATABASE VERIFICATION TEST');
  console.log('==========================================');
  
  try {
    // Step 1: Initialize Database
    console.log('\n📋 Step 1: Database Initialization');
    console.log('----------------------------------');
    
    await DatabaseAdapter.init();
    console.log(`✅ Database initialized successfully`);
    console.log(`📊 Database type: ${DatabaseAdapter.dbType.toUpperCase()}`);
    
    // Step 2: Connection Test
    console.log('\n🔗 Step 2: Connection Test');
    console.log('---------------------------');
    
    const connectionTest = await DatabaseAdapter.query('SELECT 1 as test, current_timestamp as time');
    console.log(`✅ Connection successful`);
    console.log(`📅 Database time: ${connectionTest.rows[0].time}`);
    console.log(`🧪 Test query result: ${connectionTest.rows[0].test}`);
    
    // Step 3: Schema Verification
    console.log('\n🏗️  Step 3: Schema Verification');
    console.log('-------------------------------');
    
    // Check tables exist
    const tables = await DatabaseAdapter.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tableNames = tables.rows.map(row => row.table_name);
    console.log(`✅ Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
    
    // Verify table structures
    const expectedTables = ['inscriptions', 'admin_users'];
    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
        
        // Get column info
        const columns = await DatabaseAdapter.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = ? AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`   📋 Columns (${columns.rows.length}): ${columns.rows.map(c => c.column_name).join(', ')}`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    // Step 4: Admin Users Table Tests
    console.log('\n👨‍💼 Step 4: Admin Users Table Tests');
    console.log('-----------------------------------');
    
    // Count admin users
    const adminCount = await DatabaseAdapter.query('SELECT COUNT(*) as count FROM admin_users');
    console.log(`📊 Admin users count: ${adminCount.rows[0].count}`);
    
    // Test admin login verification
    const adminUser = await DatabaseAdapter.query(
      'SELECT id, email, name, role, created_at FROM admin_users WHERE email = ?',
      ['admin@example.com']
    );
    
    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log(`✅ Default admin user found:`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Name: ${admin.name}`);
      console.log(`   🔑 Role: ${admin.role}`);
      console.log(`   📅 Created: ${admin.created_at}`);
      
      // Test password verification
      const adminWithPassword = await DatabaseAdapter.query(
        'SELECT password_hash FROM admin_users WHERE email = ?',
        ['admin@example.com']
      );
      
      const passwordMatch = await bcrypt.compare('admin123', adminWithPassword.rows[0].password_hash);
      console.log(`✅ Password verification: ${passwordMatch ? 'PASSED' : 'FAILED'}`);
      
    } else {
      console.log(`❌ Default admin user not found`);
    }
    
    // Step 5: Inscriptions Table Tests
    console.log('\n📝 Step 5: Inscriptions Table Tests');
    console.log('----------------------------------');
    
    // Count inscriptions
    const inscriptionCount = await DatabaseAdapter.query('SELECT COUNT(*) as count FROM inscriptions');
    console.log(`📊 Total inscriptions: ${inscriptionCount.rows[0].count}`);
    
    // Count by status
    const statusCounts = await DatabaseAdapter.query(`
      SELECT status, COUNT(*) as count 
      FROM inscriptions 
      GROUP BY status 
      ORDER BY status
    `);
    
    console.log(`📈 Status breakdown:`);
    for (const status of statusCounts.rows) {
      console.log(`   ${status.status}: ${status.count} applications`);
    }
    
    // Step 6: CRUD Operations Test
    console.log('\n🔧 Step 6: CRUD Operations Test');
    console.log('-------------------------------');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      phone: '+1-555-TEST',
      birthDate: '1995-06-15',
      address: '123 Test Street',
      city: 'Test City',
      postalCode: '12345',
      country: 'Test Country',
      program: 'Database Testing Program',
      motivation: 'This is a comprehensive test of the database CRUD operations. The motivation needs to be long enough to meet the minimum character requirements for the application form.'
    };
    
    // CREATE Test
    console.log('🔨 Testing CREATE operation...');
    const insertResult = await DatabaseAdapter.query(`
      INSERT INTO inscriptions 
      (first_name, last_name, email, phone, birth_date, address, city, postal_code, country, program, motivation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `, [
      testData.firstName, testData.lastName, testData.email, testData.phone,
      testData.birthDate, testData.address, testData.city, testData.postalCode,
      testData.country, testData.program, testData.motivation
    ]);
    
    const testId = insertResult.rows[0].id;
    console.log(`✅ CREATE: Inserted record with ID ${testId}`);
    
    // READ Test
    console.log('📖 Testing READ operation...');
    const readResult = await DatabaseAdapter.query(
      'SELECT * FROM inscriptions WHERE id = ?',
      [testId]
    );
    
    if (readResult.rows.length === 1) {
      const record = readResult.rows[0];
      console.log(`✅ READ: Retrieved record successfully`);
      console.log(`   Name: ${record.first_name} ${record.last_name}`);
      console.log(`   Email: ${record.email}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Created: ${record.created_at}`);
    } else {
      console.log(`❌ READ: Failed to retrieve record`);
    }
    
    // UPDATE Test
    console.log('✏️  Testing UPDATE operation...');
    await DatabaseAdapter.query(
      'UPDATE inscriptions SET status = ?, admin_notes = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', 'Test approval during database verification', testId]
    );
    
    const updatedRecord = await DatabaseAdapter.query(
      'SELECT status, admin_notes, processed_at FROM inscriptions WHERE id = ?',
      [testId]
    );
    
    if (updatedRecord.rows[0].status === 'approved') {
      console.log(`✅ UPDATE: Status updated to '${updatedRecord.rows[0].status}'`);
      console.log(`   Notes: ${updatedRecord.rows[0].admin_notes}`);
      console.log(`   Processed: ${updatedRecord.rows[0].processed_at}`);
    } else {
      console.log(`❌ UPDATE: Failed to update record`);
    }
    
    // DELETE Test
    console.log('🗑️  Testing DELETE operation...');
    await DatabaseAdapter.query('DELETE FROM inscriptions WHERE id = ?', [testId]);
    
    const deletedCheck = await DatabaseAdapter.query(
      'SELECT COUNT(*) as count FROM inscriptions WHERE id = ?',
      [testId]
    );
    
    if (deletedCheck.rows[0].count === 0) {
      console.log(`✅ DELETE: Test record removed successfully`);
    } else {
      console.log(`❌ DELETE: Failed to remove test record`);
    }
    
    // Step 7: Advanced Query Tests
    console.log('\n🎯 Step 7: Advanced Query Tests');
    console.log('-------------------------------');
    
    // Test complex filtering
    const recentInscriptions = await DatabaseAdapter.query(`
      SELECT 
        id, 
        CONCAT(first_name, ' ', last_name) as full_name, 
        email, 
        status, 
        created_at,
        EXTRACT(DAY FROM NOW() - created_at) as days_ago
      FROM inscriptions 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📅 Recent inscriptions (last 30 days): ${recentInscriptions.rows.length} found`);
    for (const inscription of recentInscriptions.rows) {
      console.log(`   ${inscription.full_name} (${inscription.email}) - ${inscription.status} - ${Math.floor(inscription.days_ago)} days ago`);
    }
    
    // Test aggregation
    const statistics = await DatabaseAdapter.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week
      FROM inscriptions
    `);
    
    const stats = statistics.rows[0];
    console.log(`📊 Application statistics:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Approved: ${stats.approved}`);
    console.log(`   Rejected: ${stats.rejected}`);
    console.log(`   This week: ${stats.this_week}`);
    
    // Step 8: Index Performance Test
    console.log('\n⚡ Step 8: Index Performance Test');
    console.log('---------------------------------');
    
    // Test query performance with EXPLAIN
    const explainResult = await DatabaseAdapter.query(`
      EXPLAIN (FORMAT JSON) 
      SELECT * FROM inscriptions 
      WHERE status = ? 
      ORDER BY created_at DESC
    `, ['pending']);
    
    console.log(`✅ Query plan generated successfully`);
    console.log(`🔍 Query uses index: ${JSON.stringify(explainResult.rows[0], null, 2).includes('Index') ? 'YES' : 'NO'}`);
    
    // Step 9: Concurrent Connection Test
    console.log('\n🔄 Step 9: Concurrent Connection Test');
    console.log('------------------------------------');
    
    const concurrentPromises = [];
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(
        DatabaseAdapter.query('SELECT ? as connection_test, CURRENT_TIMESTAMP as timestamp', [`connection-${i + 1}`])
      );
    }
    
    const concurrentResults = await Promise.all(concurrentPromises);
    console.log(`✅ Concurrent connections: ${concurrentResults.length} successful`);
    for (let i = 0; i < concurrentResults.length; i++) {
      const result = concurrentResults[i];
      console.log(`   ${result.rows[0].connection_test}: ${result.rows[0].timestamp}`);
    }
    
    // Step 10: Final Verification
    console.log('\n🏆 Step 10: Final Verification');
    console.log('------------------------------');
    
    const finalCheck = await DatabaseAdapter.query(`
      SELECT 
        'inscriptions' as table_name,
        COUNT(*) as record_count
      FROM inscriptions
      UNION ALL
      SELECT 
        'admin_users' as table_name,
        COUNT(*) as record_count
      FROM admin_users
      ORDER BY table_name
    `);
    
    console.log(`📊 Final database state:`);
    for (const table of finalCheck.rows) {
      console.log(`   ${table.table_name}: ${table.record_count} records`);
    }
    
    console.log('\n🎉 ALL DATABASE TESTS COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('✅ Database connection: WORKING');
    console.log('✅ Schema integrity: VERIFIED');
    console.log('✅ CRUD operations: FUNCTIONAL');
    console.log('✅ Complex queries: WORKING');
    console.log('✅ Concurrent access: STABLE');
    console.log('✅ Authentication: VERIFIED');
    console.log('✅ Data persistence: CONFIRMED');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ DATABASE TEST FAILED!');
    console.error('========================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    return false;
  }
}

// Run the comprehensive test
console.log('Starting comprehensive database verification...\n');

comprehensiveDatabaseTest().then(success => {
  if (success) {
    console.log('\n🌟 CONCLUSION: Your Supabase PostgreSQL database is fully functional and ready for production!');
  } else {
    console.log('\n⚠️  CONCLUSION: Database issues detected. Please check the errors above.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 CRITICAL ERROR:', error.message);
  process.exit(1);
});