const Database = require('../config/database');

console.log('🔧 Initializing database...');

// Initialize the database
Database.init();

// Give it a moment to complete
setTimeout(() => {
  console.log('✅ Database initialization completed!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Copy .env.example to .env and configure your settings');
  console.log('2. Run "npm start" to start the server');
  console.log('3. Visit http://localhost:3000 to see the registration form');
  console.log('4. Visit http://localhost:3000/admin to access the admin dashboard');
  console.log('');
  console.log('🔐 Default admin credentials:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('⚠️  Remember to change the admin password and configure email settings!');
  
  process.exit(0);
}, 2000);