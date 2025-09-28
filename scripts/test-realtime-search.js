const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testRealTimeSearch() {
  console.log('🔍 Testing Real-time Student Search...\n');

  try {
    // Test with different matricule numbers
    const testMatricules = [
      '232331573420', // AI student
      '232331674018', // Security student  
      '232332205519', // Software Engineering student
      '999999999999'  // Non-existent student
    ];

    for (const matricule of testMatricules) {
      console.log(`🔍 Searching for matricule: ${matricule}`);
      
      try {
        const response = await axios.post(`${API_BASE}/students/search`, {
          matricule: matricule
        });
        
        if (response.data.success) {
          const student = response.data.student;
          console.log(`✅ Found: ${student.first_name} ${student.last_name}`);
          console.log(`   Matricule: ${student.matricule}`);
          console.log(`   Specialty: ${student.current_specialty}`);
          console.log(`   Section: ${student.palier} ${student.current_specialty} ${student.section}`);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`❌ Student not found: ${matricule}`);
        } else {
          console.log(`❌ Error searching ${matricule}:`, error.response?.data?.message || error.message);
        }
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('🎉 Real-time search test completed!');
    console.log('\n📝 Instructions for testing in browser:');
    console.log('1. Open http://localhost:3000/specialty-change');
    console.log('2. Start typing a matricule number (e.g., 232331573420)');
    console.log('3. Student info should appear automatically as you type');
    console.log('4. Try different matricule numbers to see real-time updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testRealTimeSearch();