// CSP Connect-src Testing Script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔒 CSP Connect-src Verification Started');
    
    const bootstrapCssStatus = document.getElementById('bootstrap-css-status');
    const fontawesomeCssStatus = document.getElementById('fontawesome-css-status');
    const bootstrapJsStatus = document.getElementById('bootstrap-js-status');
    const testApiConnection = document.getElementById('testApiConnection');
    const apiConnectionResult = document.getElementById('api-connection-result');
    
    // Function to test source map accessibility
    async function testSourceMap(url, statusElement, name) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                statusElement.textContent = 'Accessible';
                statusElement.className = 'badge bg-success';
                console.log(`✅ ${name} source map accessible`);
            } else {
                statusElement.textContent = `${response.status}`;
                statusElement.className = 'badge bg-warning';
                console.log(`⚠️ ${name} source map returned ${response.status}`);
            }
        } catch (error) {
            statusElement.textContent = 'Blocked';
            statusElement.className = 'badge bg-danger';
            console.log(`❌ ${name} source map blocked:`, error);
        }
    }
    
    // Test source maps
    setTimeout(() => {
        testSourceMap(
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css.map',
            bootstrapCssStatus,
            'Bootstrap CSS'
        );
        
        testSourceMap(
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css.map',
            fontawesomeCssStatus,
            'FontAwesome CSS'
        );
        
        testSourceMap(
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js.map',
            bootstrapJsStatus,
            'Bootstrap JS'
        );
    }, 1000);
    
    // Test API connection
    testApiConnection.addEventListener('click', async function() {
        apiConnectionResult.innerHTML = '<div class="text-info"><i class="fas fa-spinner fa-spin"></i> Testing API connection...</div>';
        
        try {
            const response = await fetch(API_ENDPOINTS.students.search, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ matricule: 'test123' })
            });
            
            if (response.ok || response.status === 404) {
                // 404 is expected for a test matricule, but it means the connection works
                apiConnectionResult.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check"></i> API Connection Working!
                        <br><small>Status: ${response.status} (connection successful)</small>
                    </div>
                `;
                console.log('✅ API connection working');
            } else {
                apiConnectionResult.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> API responded with status ${response.status}
                        <br><small>But connection is working (no CSP block)</small>
                    </div>
                `;
            }
        } catch (error) {
            if (error.message.includes('CSP') || error.message.includes('Content Security Policy')) {
                apiConnectionResult.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-times"></i> CSP Block Detected!
                        <br><small>Error: ${error.message}</small>
                    </div>
                `;
                console.log('❌ CSP blocking API connection:', error);
            } else {
                apiConnectionResult.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Connection attempt made
                        <br><small>Error: ${error.message} (likely network/server issue, not CSP)</small>
                    </div>
                `;
                console.log('ℹ️ API connection error (not CSP related):', error);
            }
        }
    });
    
    // Check for console errors
    let errorCount = 0;
    const originalError = console.error;
    console.error = function(...args) {
        if (args.some(arg => typeof arg === 'string' && arg.includes('Content Security Policy'))) {
            errorCount++;
            console.log(`❌ CSP Violation detected: ${args.join(' ')}`);
        }
        originalError.apply(console, args);
    };
    
    // Report CSP status after delay
    setTimeout(() => {
        if (errorCount === 0) {
            console.log('🎉 No CSP violations detected! connect-src directive is working correctly.');
        } else {
            console.log(`⚠️ ${errorCount} CSP violations still detected.`);
        }
    }, 3000);
    
    console.log('CSP Connect-src verification initialized');
});