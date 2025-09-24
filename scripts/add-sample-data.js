const Database = require('../config/database');

// Sample inscriptions data
const sampleData = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    birth_date: '1995-05-15',
    address: '123 Main Street',
    city: 'New York',
    postal_code: '10001',
    country: 'United States',
    program: 'Computer Science',
    motivation: 'I am passionate about technology and software development. I have been coding for over 3 years and want to advance my skills in computer science to work on innovative projects that can make a positive impact on society.',
    status: 'pending'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-987-6543',
    birth_date: '1992-08-22',
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    postal_code: '90210',
    country: 'United States',
    program: 'Business Administration',
    motivation: 'My goal is to become a successful entrepreneur and start my own company. I believe a strong foundation in business administration will provide me with the knowledge and skills necessary to achieve this dream.',
    status: 'approved'
  },
  {
    first_name: 'Michael',
    last_name: 'Smith',
    email: 'michael.smith@example.com',
    phone: '+1-555-456-7890',
    birth_date: '1997-12-03',
    address: '789 Pine Road',
    city: 'Chicago',
    postal_code: '60601',
    country: 'United States',
    program: 'Engineering',
    motivation: 'Engineering has always fascinated me, especially the way engineers solve complex problems and create solutions that improve peoples lives. I want to specialize in renewable energy systems to help combat climate change.',
    status: 'pending'
  },
  {
    first_name: 'Emma',
    last_name: 'Brown',
    email: 'emma.brown@example.com',
    phone: '+44-20-1234-5678',
    birth_date: '1994-03-18',
    address: '10 Downing Street',
    city: 'London',
    postal_code: 'SW1A 2AA',
    country: 'United Kingdom',
    program: 'Medicine',
    motivation: 'I have always wanted to help people and make a difference in their lives. Medicine offers me the opportunity to combine my love of science with my desire to care for others and contribute to the advancement of healthcare.',
    status: 'rejected'
  },
  {
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '+33-1-23-45-67-89',
    birth_date: '1996-11-30',
    address: '15 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    program: 'Data Science',
    motivation: 'Data is everywhere, and I believe that data science is the key to unlocking valuable insights that can drive decision-making across all industries. I want to develop my skills in machine learning and statistical analysis to become a data scientist.',
    status: 'approved'
  }
];

async function addSampleData() {
  console.log('📊 Adding sample data to the database...');
  
  // Initialize database first
  Database.init();
  
  // Wait for database to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const db = Database.getPool();
  
  try {
    for (let i = 0; i < sampleData.length; i++) {
      const inscription = sampleData[i];
      const client = await db.connect();
      
      try {
        const result = await client.query(`
          INSERT INTO inscriptions (
            first_name, last_name, email, phone, birth_date,
            address, city, postal_code, country, program, motivation, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `, [
          inscription.first_name, inscription.last_name, inscription.email,
          inscription.phone, inscription.birth_date, inscription.address,
          inscription.city, inscription.postal_code, inscription.country,
          inscription.program, inscription.motivation, inscription.status
        ]);
        
        if (result.rows.length > 0) {
          console.log(`✅ Added: ${inscription.first_name} ${inscription.last_name} (${inscription.status})`);
        } else {
          console.log(`⏭️  Skipped: ${inscription.first_name} ${inscription.last_name} (already exists)`);
        }
      } catch (err) {
        console.error(`❌ Error adding ${inscription.first_name} ${inscription.last_name}:`, err.message);
      } finally {
        client.release();
      }
    }
    
    console.log('');
    console.log('🎉 Sample data setup completed!');
    console.log('');
    console.log('📊 Sample data includes:');
    console.log('   • 2 Pending applications (John Doe, Michael Smith)');
    console.log('   • 2 Approved applications (Sarah Johnson, David Wilson)');
    console.log('   • 1 Rejected application (Emma Brown)');
    console.log('');
    console.log('🌐 Visit your application:');
    console.log('   • Registration: http://localhost:3000');
    console.log('   • Admin Dashboard: http://localhost:3000/admin');
    console.log('   • Admin Login: admin@example.com / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up sample data:', error);
    process.exit(1);
  }
}

addSampleData();