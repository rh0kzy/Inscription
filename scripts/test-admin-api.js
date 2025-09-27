const https = require('http');

async function testApprovalAPI() {
    console.log('🧪 Testing Admin API endpoints...\n');
    
    // Test data
    const testData = {
        email: 'admin@example.com',
        password: 'admin123'
    };

    try {
        // First, let's test login to get a token
        console.log('1. Testing admin login...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const loginResult = await loginResponse.json();
        console.log('Login result:', loginResult);

        if (!loginResult.success) {
            console.error('❌ Login failed. Cannot test API endpoints.');
            return;
        }

        const token = loginResult.token;
        console.log('✅ Login successful, token obtained');

        // Test getting inscriptions
        console.log('\n2. Testing get inscriptions...');
        const inscriptionsResponse = await fetch('http://localhost:3000/api/admin/inscriptions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const inscriptionsResult = await inscriptionsResponse.json();
        console.log('Inscriptions result:', inscriptionsResult);

        if (inscriptionsResult.success && inscriptionsResult.data.inscriptions.length > 0) {
            const testInscription = inscriptionsResult.data.inscriptions[0];
            console.log('✅ Found inscriptions, testing with ID:', testInscription.id);

            // Test updating status
            console.log('\n3. Testing status update...');
            const updateResponse = await fetch(`http://localhost:3000/api/admin/inscriptions/${testInscription.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'approved',
                    admin_notes: 'Test approval from API test'
                })
            });

            const updateResult = await updateResponse.json();
            console.log('Update result:', updateResult);

            if (updateResult.success) {
                console.log('✅ API endpoint working correctly!');
                console.log('📧 Email should have been sent to:', testInscription.email);
            } else {
                console.log('❌ API update failed:', updateResult.message);
            }
        } else {
            console.log('⚠️  No inscriptions found to test with');
        }

    } catch (error) {
        console.error('❌ API test error:', error.message);
        console.log('\n💡 Make sure the server is running on port 3000');
    }
}

// Add fetch polyfill for Node.js (if needed)
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

// Run the test
testApprovalAPI();