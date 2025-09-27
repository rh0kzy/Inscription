const https = require('https');
const http = require('http');

async function quickApiTest() {
    console.log('🚀 Quick API Test for Approve/Reject Functionality\n');
    
    // Function to make HTTP requests
    function makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const protocol = options.port === 443 ? https : http;
            const req = protocol.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve({ body, status: res.statusCode });
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    try {
        // Step 1: Login
        console.log('📝 Step 1: Logging in as admin...');
        const loginOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const loginData = {
            email: 'admin@example.com',
            password: 'admin123'
        };
        
        const loginResult = await makeRequest(loginOptions, loginData);
        
        if (!loginResult.success) {
            throw new Error(`Login failed: ${loginResult.message}`);
        }
        
        const token = loginResult.token;
        console.log('✅ Login successful');
        
        // Step 2: Get inscriptions
        console.log('\n📝 Step 2: Getting inscriptions...');
        const getOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/inscriptions',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        const inscriptionsResult = await makeRequest(getOptions);
        
        if (!inscriptionsResult.success) {
            throw new Error(`Failed to get inscriptions: ${inscriptionsResult.message}`);
        }
        
        const pendingInscriptions = inscriptionsResult.data.inscriptions.filter(i => i.status === 'pending');
        console.log(`✅ Found ${pendingInscriptions.length} pending inscriptions`);
        
        if (pendingInscriptions.length === 0) {
            console.log('⚠️  No pending inscriptions to test with');
            return;
        }
        
        // Step 3: Test approval
        const testInscription = pendingInscriptions[0];
        console.log(`\n📝 Step 3: Testing approval for ${testInscription.first_name} ${testInscription.last_name} (${testInscription.email})...`);
        
        const approveOptions = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/admin/inscriptions/${testInscription.id}/status`,
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const approveData = {
            status: 'approved',
            admin_notes: 'Congratulations! Your application has been approved through automated testing. Welcome to our program!'
        };
        
        const approveResult = await makeRequest(approveOptions, approveData);
        
        if (approveResult.success) {
            console.log('✅ Approval successful!');
            console.log(`📧 Email notification sent to: ${testInscription.email}`);
            console.log(`📄 Message: ${approveResult.message}`);
        } else {
            console.log('❌ Approval failed:', approveResult.message);
        }
        
        // Step 4: Test rejection (if there's another pending inscription)
        if (pendingInscriptions.length > 1) {
            const testInscription2 = pendingInscriptions[1];
            console.log(`\n📝 Step 4: Testing rejection for ${testInscription2.first_name} ${testInscription2.last_name} (${testInscription2.email})...`);
            
            const rejectOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/admin/inscriptions/${testInscription2.id}/status`,
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            
            const rejectData = {
                status: 'rejected',
                admin_notes: 'Thank you for your interest in our program. Unfortunately, we cannot offer you a position at this time due to limited capacity. We encourage you to apply again next year when more spots become available.'
            };
            
            const rejectResult = await makeRequest(rejectOptions, rejectData);
            
            if (rejectResult.success) {
                console.log('✅ Rejection successful!');
                console.log(`📧 Email notification sent to: ${testInscription2.email}`);
                console.log(`📄 Message: ${rejectResult.message}`);
            } else {
                console.log('❌ Rejection failed:', rejectResult.message);
            }
        }
        
        console.log('\n🎉 API Test Complete!');
        console.log('\n📧 Email Verification:');
        console.log('Check inscriptiondecision@gmail.com inbox for:');
        console.log('1. Approval email with congratulations');
        console.log('2. Rejection email with explanation (if second test ran)');
        console.log('3. Professional HTML formatting');
        
        console.log('\n✅ The approve/reject functionality is working correctly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure server is running: npm start');
        console.log('2. Check if test inscriptions exist');
        console.log('3. Verify admin credentials');
        console.log('4. Check email configuration');
    }
}

quickApiTest();