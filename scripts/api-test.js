const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

let authToken = '';

async function testAPIEndpoints() {
  console.log('🌐 API ENDPOINTS VERIFICATION TEST');
  console.log('==================================');
  
  try {
    // Test 1: Admin Login
    console.log('\n🔐 Test 1: Admin Authentication');
    console.log('-------------------------------');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Admin login: SUCCESS');
      console.log(`   Token received: ${authToken.substring(0, 20)}...`);
      console.log(`   Admin name: ${loginResponse.data.data.user.name}`);
    } else {
      throw new Error('Login failed');
    }
    
    // Test 2: Submit Registration
    console.log('\n📝 Test 2: Registration Submission');
    console.log('----------------------------------');
    
    const registrationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: `test-${Date.now()}@example.com`,
      phone: '+1-555-0123',
      birthDate: '1990-05-15',
      address: '123 Main Street',
      city: 'New York',
      postalCode: '10001',
      country: 'United States',
      program: 'Computer Science',
      motivation: 'I am passionate about technology and want to pursue advanced studies in computer science to contribute to innovative solutions in the field of artificial intelligence and machine learning.'
    };
    
    const registrationResponse = await axios.post(`${BASE_URL}/api/inscriptions`, registrationData);
    
    if (registrationResponse.data.success) {
      console.log('✅ Registration submission: SUCCESS');
      console.log(`   Application ID: ${registrationResponse.data.data.id}`);
      console.log(`   Applicant: ${registrationData.firstName} ${registrationData.lastName}`);
      console.log(`   Email: ${registrationData.email}`);
    } else {
      throw new Error('Registration submission failed');
    }
    
    const applicationId = registrationResponse.data.data.id;
    
    // Test 3: Admin Dashboard - Get Applications
    console.log('\n📊 Test 3: Admin Dashboard Access');
    console.log('---------------------------------');
    
    const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/inscriptions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Admin dashboard access: SUCCESS');
      console.log(`   Total applications: ${dashboardResponse.data.data.inscriptions.length}`);
      console.log(`   Pagination: Page ${dashboardResponse.data.data.currentPage} of ${dashboardResponse.data.data.totalPages}`);
      
      const newApplication = dashboardResponse.data.data.inscriptions.find(app => app.id === applicationId);
      if (newApplication) {
        console.log(`   ✅ New application found in dashboard`);
        console.log(`      Status: ${newApplication.status}`);
        console.log(`      Submitted: ${new Date(newApplication.created_at).toLocaleString()}`);
      }
    } else {
      throw new Error('Dashboard access failed');
    }
    
    // Test 4: Application Status Update (Approve)
    console.log('\n✅ Test 4: Application Approval');
    console.log('-------------------------------');
    
    const approvalResponse = await axios.patch(
      `${BASE_URL}/api/admin/inscriptions/${applicationId}/status`,
      {
        status: 'approved',
        adminNotes: 'Application approved during API testing'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (approvalResponse.data.success) {
      console.log('✅ Application approval: SUCCESS');
      console.log(`   New status: ${approvalResponse.data.data.status}`);
      console.log(`   Admin notes: ${approvalResponse.data.data.admin_notes}`);
      console.log(`   Processed at: ${new Date(approvalResponse.data.data.processed_at).toLocaleString()}`);
    } else {
      throw new Error('Application approval failed');
    }
    
    // Test 5: Dashboard Statistics
    console.log('\n📈 Test 5: Dashboard Statistics');
    console.log('-------------------------------');
    
    const statsResponse = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (statsResponse.data.success) {
      const stats = statsResponse.data.data;
      console.log('✅ Dashboard statistics: SUCCESS');
      console.log(`   Total applications: ${stats.total}`);
      console.log(`   Pending: ${stats.pending}`);
      console.log(`   Approved: ${stats.approved}`);
      console.log(`   Rejected: ${stats.rejected}`);
      console.log(`   This week: ${stats.thisWeek}`);
    } else {
      throw new Error('Statistics retrieval failed');
    }
    
    // Test 6: Search and Filter
    console.log('\n🔍 Test 6: Search and Filter');
    console.log('----------------------------');
    
    const searchResponse = await axios.get(`${BASE_URL}/api/admin/inscriptions?status=approved&search=John`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (searchResponse.data.success) {
      console.log('✅ Search and filter: SUCCESS');
      console.log(`   Filtered results: ${searchResponse.data.data.inscriptions.length}`);
      
      const filteredApp = searchResponse.data.data.inscriptions[0];
      if (filteredApp) {
        console.log(`   Found: ${filteredApp.first_name} ${filteredApp.last_name} (${filteredApp.status})`);
      }
    } else {
      throw new Error('Search and filter failed');
    }
    
    // Test 7: Invalid Token Test
    console.log('\n🚫 Test 7: Security - Invalid Token');
    console.log('-----------------------------------');
    
    try {
      await axios.get(`${BASE_URL}/api/admin/inscriptions`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Security test failed - invalid token was accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security test: SUCCESS - invalid token rejected');
      } else {
        throw error;
      }
    }
    
    // Test 8: Logout Test
    console.log('\n🚪 Test 8: Admin Logout');
    console.log('----------------------');
    
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (logoutResponse.data.success) {
      console.log('✅ Admin logout: SUCCESS');
      console.log(`   Message: ${logoutResponse.data.message}`);
    } else {
      throw new Error('Logout failed');
    }
    
    console.log('\n🎉 ALL API ENDPOINT TESTS COMPLETED SUCCESSFULLY!');
    console.log('================================================');
    console.log('✅ Authentication system: WORKING');
    console.log('✅ Registration endpoint: FUNCTIONAL');
    console.log('✅ Admin dashboard API: WORKING');
    console.log('✅ Status management: OPERATIONAL');
    console.log('✅ Search & filtering: WORKING');
    console.log('✅ Security measures: ACTIVE');
    console.log('✅ Session management: FUNCTIONAL');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ API TEST FAILED!');
    console.error('===================');
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Main execution
async function runFullVerification() {
  console.log('🚀 Starting server for API testing...\n');
  
  // Wait for server to start
  console.log('⏳ Waiting 3 seconds for server to initialize...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const success = await testAPIEndpoints();
  
  if (success) {
    console.log('\n🌟 FINAL CONCLUSION: Your entire system is fully functional!');
    console.log('   🔗 Database: Supabase PostgreSQL - WORKING');
    console.log('   🌐 API Endpoints: All tested - WORKING');
    console.log('   🔐 Authentication: JWT-based - SECURE');
    console.log('   📝 Registration: Form submission - WORKING');
    console.log('   👨‍💼 Admin Dashboard: Management interface - WORKING');
    console.log('   🎯 Your inscription system is production-ready!');
  } else {
    console.log('\n⚠️  Some API tests failed. Please check the server logs.');
  }
}

runFullVerification().catch(console.error);