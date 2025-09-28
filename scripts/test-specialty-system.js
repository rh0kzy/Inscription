const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testSpecialtyChangeSystem() {
  console.log('🧪 Testing Specialty Change System...\n');

  try {
    // Test 1: Search for a student
    console.log('1️⃣ Testing student search...');
    
    const searchResponse = await axios.post(`${API_BASE}/students/search`, {
      matricule: '232332205519' // Different student from GL CSV
    });
    
    if (searchResponse.data.success) {
      console.log('✅ Student found:', searchResponse.data.student.first_name, searchResponse.data.student.last_name);
      
      // Test 2: Create a specialty change request
      console.log('\n2️⃣ Testing specialty change request creation...');
      
      const student = searchResponse.data.student;
      const requestResponse = await axios.post(`${API_BASE}/specialty-requests`, {
        matricule: student.matricule,
        currentSpecialty: student.current_specialty,
        requestedSpecialty: student.current_specialty === 'IA' ? 'SECU' : 'IA',
        motivation: 'Je souhaite changer de spécialité car je suis très intéressé par la cybersécurité et je pense que cette spécialité correspond mieux à mes objectifs professionnels. J\'ai toujours été passionné par la sécurité informatique et je souhaite développer mes compétences dans ce domaine.',
        priority: 'normal'
      });
      
      if (requestResponse.data.success) {
        console.log('✅ Request created with ID:', requestResponse.data.requestId);
        
        // Test 3: Get statistics
        console.log('\n3️⃣ Testing statistics API...');
        
        const statsResponse = await axios.get(`${API_BASE}/specialty-requests/statistics`);
        
        if (statsResponse.data.success) {
          console.log('✅ Statistics loaded:');
          console.log('  - Requests by status:', statsResponse.data.statistics.requestsByStatus);
          console.log('  - Students by specialty:', statsResponse.data.statistics.studentsByCurrentSpecialty);
          
          // Test 4: Get all requests
          console.log('\n4️⃣ Testing requests list API...');
          
          const listResponse = await axios.get(`${API_BASE}/specialty-requests`);
          
          if (listResponse.data.success) {
            console.log(`✅ Found ${listResponse.data.requests.length} requests`);
            
            console.log('\n🎉 All tests passed! The specialty change system is working correctly.');
          } else {
            console.log('❌ Failed to get requests list');
          }
        } else {
          console.log('❌ Failed to get statistics');
        }
      } else {
        console.log('❌ Failed to create request:', requestResponse.data.message);
      }
    } else {
      console.log('❌ Student not found:', searchResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run tests
testSpecialtyChangeSystem();