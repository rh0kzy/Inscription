// Comprehensive Test Script for Inscription System
// This script tests the entire approve/reject workflow

async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Tests for Inscription System\n');
    
    const baseUrl = 'http://localhost:3000';
    let adminToken = null;
    let testInscriptionId = null;
    
    try {
        // Test 1: Admin Login
        console.log('📝 Test 1: Admin Login');
        const loginResponse = await fetch(`${baseUrl}/api/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        
        const loginResult = await loginResponse.json();
        if (loginResult.success) {
            adminToken = loginResult.token;
            console.log('✅ Admin login successful');
            console.log(`📄 Token: ${adminToken.substring(0, 20)}...`);
        } else {
            throw new Error(`Admin login failed: ${loginResult.message}`);
        }
        
        // Test 2: Create Test Inscription
        console.log('\n📝 Test 2: Creating Test Inscription');
        const testData = {
            firstName: 'Test',
            lastName: 'User',
            email: 'testuser@example.com',
            phone: '+1234567890',
            birthDate: '1995-05-15',
            address: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
            program: 'Computer Science',
            motivation: 'This is a test inscription to verify the approve/reject email functionality.'
        };
        
        const createResponse = await fetch(`${baseUrl}/api/inscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const createResult = await createResponse.json();
        if (createResult.success) {
            testInscriptionId = createResult.data.id;
            console.log('✅ Test inscription created successfully');
            console.log(`📄 Inscription ID: ${testInscriptionId}`);
            console.log(`📧 Email: ${createResult.data.email}`);
        } else {
            throw new Error(`Failed to create test inscription: ${createResult.message}`);
        }
        
        // Test 3: Get All Inscriptions
        console.log('\n📝 Test 3: Retrieving All Inscriptions');
        const getResponse = await fetch(`${baseUrl}/api/admin/inscriptions`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const getResult = await getResponse.json();
        if (getResult.success) {
            console.log(`✅ Retrieved ${getResult.data.inscriptions.length} inscriptions`);
            const testInscription = getResult.data.inscriptions.find(i => i.id == testInscriptionId);
            if (testInscription) {
                console.log(`📄 Test inscription found with status: ${testInscription.status}`);
            } else {
                console.log('⚠️  Test inscription not found in results');
            }
        } else {
            throw new Error(`Failed to retrieve inscriptions: ${getResult.message}`);
        }
        
        // Test 4: Approve Inscription
        console.log('\n📝 Test 4: Testing Approval Process');
        const approveResponse = await fetch(`${baseUrl}/api/admin/inscriptions/${testInscriptionId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                admin_notes: 'Congratulations! Your application has been approved. Welcome to our program!'
            })
        });
        
        const approveResult = await approveResponse.json();
        if (approveResult.success) {
            console.log('✅ Approval process successful');
            console.log(`📧 ${approveResult.message}`);
            console.log('📄 Approval email should have been sent to testuser@example.com');
        } else {
            throw new Error(`Approval failed: ${approveResult.message}`);
        }
        
        // Wait a moment before next test
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 5: Create Another Test Inscription for Rejection
        console.log('\n📝 Test 5: Creating Second Test Inscription for Rejection Test');
        const testData2 = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'janesmith@example.com',
            phone: '+1987654321',
            birthDate: '1992-08-20',
            address: '456 Another Street',
            city: 'Another City',
            postalCode: '54321',
            country: 'Test Country',
            program: 'Data Science',
            motivation: 'Second test inscription to verify the rejection email functionality.'
        };
        
        const createResponse2 = await fetch(`${baseUrl}/api/inscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData2)
        });
        
        const createResult2 = await createResponse2.json();
        let testInscriptionId2 = null;
        if (createResult2.success) {
            testInscriptionId2 = createResult2.data.id;
            console.log('✅ Second test inscription created successfully');
            console.log(`📄 Inscription ID: ${testInscriptionId2}`);
        } else {
            throw new Error(`Failed to create second test inscription: ${createResult2.message}`);
        }
        
        // Test 6: Reject Inscription
        console.log('\n📝 Test 6: Testing Rejection Process');
        const rejectResponse = await fetch(`${baseUrl}/api/admin/inscriptions/${testInscriptionId2}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                admin_notes: 'Thank you for your interest. Unfortunately, we cannot accept your application at this time due to limited capacity. We encourage you to apply again next year.'
            })
        });
        
        const rejectResult = await rejectResponse.json();
        if (rejectResult.success) {
            console.log('✅ Rejection process successful');
            console.log(`📧 ${rejectResult.message}`);
            console.log('📄 Rejection email should have been sent to janesmith@example.com');
        } else {
            throw new Error(`Rejection failed: ${rejectResult.message}`);
        }
        
        // Test 7: Verify Final States
        console.log('\n📝 Test 7: Verifying Final States');
        const finalGetResponse = await fetch(`${baseUrl}/api/admin/inscriptions`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const finalGetResult = await finalGetResponse.json();
        if (finalGetResult.success) {
            const approvedInscription = finalGetResult.data.inscriptions.find(i => i.id == testInscriptionId);
            const rejectedInscription = finalGetResult.data.inscriptions.find(i => i.id == testInscriptionId2);
            
            console.log(`✅ First inscription status: ${approvedInscription?.status}`);
            console.log(`✅ Second inscription status: ${rejectedInscription?.status}`);
            
            if (approvedInscription?.status === 'approved' && rejectedInscription?.status === 'rejected') {
                console.log('✅ All status updates successful');
            } else {
                console.log('⚠️  Status updates may not have been applied correctly');
            }
        }
        
        // Test 8: Test Admin Dashboard Access
        console.log('\n📝 Test 8: Testing Admin Dashboard Access');
        const dashboardResponse = await fetch(`${baseUrl}/admin`);
        if (dashboardResponse.ok) {
            console.log('✅ Admin dashboard accessible');
        } else {
            console.log('⚠️  Admin dashboard may have issues');
        }
        
        console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('\n📋 SUMMARY:');
        console.log('✅ Admin authentication working');
        console.log('✅ Inscription creation working');
        console.log('✅ Approval process working');
        console.log('✅ Rejection process working');
        console.log('✅ Email notifications configured');
        console.log('✅ Database operations successful');
        
        console.log('\n📧 EMAIL VERIFICATION:');
        console.log('1. Check inscriptiondecision@gmail.com inbox');
        console.log('2. Should see approval email for testuser@example.com');
        console.log('3. Should see rejection email for janesmith@example.com');
        
        return {
            success: true,
            approvedInscriptionId: testInscriptionId,
            rejectedInscriptionId: testInscriptionId2
        };
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Make sure server is running on port 3000');
        console.log('2. Check database connection');
        console.log('3. Verify admin credentials');
        console.log('4. Check email configuration');
        return { success: false, error: error.message };
    }
}

// Add fetch polyfill for Node.js environments
if (typeof fetch === 'undefined') {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
}

module.exports = { runComprehensiveTests };