const http = require('http');

async function debugLogin() {
  console.log('🐛 DEBUG: Admin Login Issue');
  console.log('===========================');
  
  // Test login endpoint
  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  console.log('\n📝 Testing POST /api/auth/login...');
  
  return new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response Body: ${data}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            if (result.success && result.data && result.data.token) {
              console.log('✅ LOGIN WORKING: Token received');
              
              // Now test GET /api/auth/verify (what admin-login.html does)
              console.log('\n🔐 Testing GET /api/auth/verify...');
              
              const verifyOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/auth/verify',
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${result.data.token}`
                }
              };
              
              const verifyReq = http.request(verifyOptions, (verifyRes) => {
                let verifyData = '';
                
                verifyRes.on('data', (chunk) => {
                  verifyData += chunk;
                });
                
                verifyRes.on('end', () => {
                  console.log(`Verify Status: ${verifyRes.statusCode}`);
                  console.log(`Verify Response: ${verifyData}`);
                  
                  if (verifyRes.statusCode === 404) {
                    console.log('');
                    console.log('🎯 FOUND THE PROBLEM!');
                    console.log('=====================');
                    console.log('❌ The admin-login.html sends GET request to /api/auth/verify');
                    console.log('❌ But the route only accepts POST requests');
                    console.log('❌ This causes 404 error, token verification fails');
                    console.log('❌ Admin dashboard redirects back to login page');
                    console.log('');
                    console.log('💡 SOLUTION: Add GET support to /api/auth/verify route');
                  }
                  resolve();
                });
              });
              
              verifyReq.on('error', (err) => {
                console.log('Verify Error:', err.message);
                resolve();
              });
              
              verifyReq.end();
              
            } else {
              console.log('❌ Login failed:', result.message);
              resolve();
            }
          } catch (error) {
            console.log('❌ JSON parse error:', error.message);
            resolve();
          }
        } else {
          console.log('❌ Login request failed with status:', res.statusCode);
          resolve();
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      resolve();
    });
    
    req.write(loginData);
    req.end();
  });
}

// Wait for server and run debug
setTimeout(() => {
  debugLogin().then(() => {
    console.log('🏁 Debug completed!');
    process.exit(0);
  });
}, 2000);