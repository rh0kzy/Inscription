// Test authentication functionality
const testAuth = async () => {
    console.log('Testing admin authentication...');
    
    try {
        // Test login
        const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        
        const loginResult = await loginResponse.json();
        console.log('Login response:', loginResult);
        
        if (loginResult.success) {
            const token = loginResult.data.token;
            console.log('Login successful, token received');
            
            // Test token verification
            const verifyResponse = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const verifyResult = await verifyResponse.json();
            console.log('Verify response:', verifyResult);
            
            // Test logout
            const logoutResponse = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const logoutResult = await logoutResponse.json();
            console.log('Logout response:', logoutResult);
            
        } else {
            console.error('Login failed:', loginResult.message);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
};

// Run test when page loads
document.addEventListener('DOMContentLoaded', testAuth);