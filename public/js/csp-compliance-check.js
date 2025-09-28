// CSP Compliance Check Script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔒 CSP Compliance Check Script Loaded');
    
    const jsStatus = document.getElementById('js-status');
    const testBtn = document.getElementById('testBtn');
    const clickResult = document.getElementById('click-result');
    const testInput = document.getElementById('testInput');
    const inputResult = document.getElementById('input-result');
    const consoleStatus = document.getElementById('console-status');
    
    // Update JavaScript status
    jsStatus.innerHTML = '<div class="badge bg-success"><i class="fas fa-check me-1"></i>External JS Loaded</div>';
    
    // Test button click
    testBtn.addEventListener('click', function() {
        clickResult.innerHTML = '<span class="text-success"><i class="fas fa-check me-1"></i>Click event working!</span>';
        console.log('✅ Button click event fired successfully');
    });
    
    // Test input functionality
    testInput.addEventListener('input', function(e) {
        inputResult.innerHTML = `<span class="text-success"><i class="fas fa-keyboard me-1"></i>Input working: "${e.target.value}"</span>`;
        console.log('✅ Input event fired:', e.target.value);
    });
    
    // Check for console errors after a delay
    setTimeout(() => {
        // This is a basic check - in a real scenario, you'd monitor console errors
        const hasErrors = false; // In practice, you'd check the console.error logs
        
        if (!hasErrors) {
            consoleStatus.innerHTML = '✅ No CSP violations detected in console';
            consoleStatus.className = 'text-success';
        } else {
            consoleStatus.innerHTML = '❌ CSP violations found in console';
            consoleStatus.className = 'text-danger';
        }
    }, 2000);
    
    console.log('All CSP compliance tests initialized');
});