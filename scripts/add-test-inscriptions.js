const Database = require('../config/database-adapter');

async function addTestInscriptions() {
    console.log('🧪 Adding test inscriptions for manual testing...\n');
    
    try {
        await Database.init();
        console.log('✅ Database connected');
        
        const testInscriptions = [
            {
                first_name: 'Alice',
                last_name: 'Johnson',
                email: 'alice.johnson@example.com',
                phone: '+1234567890',
                birth_date: '1995-03-15',
                address: '123 Main Street',
                city: 'New York',
                postal_code: '10001',
                country: 'USA',
                program: 'Computer Science',
                motivation: 'I am passionate about technology and want to pursue a career in software development. This program aligns perfectly with my goals.'
            },
            {
                first_name: 'Bob',
                last_name: 'Smith',
                email: 'bob.smith@example.com',
                phone: '+1987654321',
                birth_date: '1993-07-22',
                address: '456 Oak Avenue',
                city: 'Los Angeles',
                postal_code: '90210',
                country: 'USA',
                program: 'Data Science',
                motivation: 'Data science is the future, and I want to be part of it. I have strong analytical skills and am eager to learn.'
            },
            {
                first_name: 'Carol',
                last_name: 'Davis',
                email: 'carol.davis@example.com',
                phone: '+1555123456',
                birth_date: '1996-11-08',
                address: '789 Pine Road',
                city: 'Chicago',
                postal_code: '60601',
                country: 'USA',
                program: 'Artificial Intelligence',
                motivation: 'AI is transforming the world, and I want to contribute to this revolution. My background in mathematics makes me a perfect fit.'
            }
        ];
        
        let insertedCount = 0;
        
        for (const inscription of testInscriptions) {
            try {
                const result = await Database.query(`
                    INSERT INTO inscriptions (
                        first_name, last_name, email, phone, birth_date,
                        address, city, postal_code, country, program,
                        motivation, status, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
                    RETURNING id, email
                `, [
                    inscription.first_name, inscription.last_name, inscription.email,
                    inscription.phone, inscription.birth_date, inscription.address,
                    inscription.city, inscription.postal_code, inscription.country,
                    inscription.program, inscription.motivation, 'pending'
                ]);
                
                const insertedInscription = result.rows[0];
                console.log(`✅ Added: ${inscription.first_name} ${inscription.last_name} (ID: ${insertedInscription.id})`);
                insertedCount++;
                
            } catch (error) {
                if (error.message.includes('unique constraint')) {
                    console.log(`⚠️  Skipped: ${inscription.first_name} ${inscription.last_name} (already exists)`);
                } else {
                    console.error(`❌ Failed to add ${inscription.first_name} ${inscription.last_name}:`, error.message);
                }
            }
        }
        
        console.log(`\n📊 Summary: ${insertedCount} new test inscriptions added`);
        console.log('\n🎯 You can now test the admin interface:');
        console.log('1. Go to: http://localhost:3000/admin');
        console.log('2. Login with: admin@example.com / admin123');
        console.log('3. Click "Approve" or "Reject" on any pending inscription');
        console.log('4. Check inscriptiondecision@gmail.com for email notifications');
        
    } catch (error) {
        console.error('❌ Error adding test inscriptions:', error.message);
    }
}

addTestInscriptions();