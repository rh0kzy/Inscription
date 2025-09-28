// API Endpoint Testing Script
document.addEventListener('DOMContentLoaded', function() {
    const testMatricule = document.getElementById('testMatricule');
    const testStudentSearch = document.getElementById('testStudentSearch');
    const studentSearchResult = document.getElementById('studentSearchResult');
    const testSpecialtyRequest = document.getElementById('testSpecialtyRequest');
    const specialtyRequestResult = document.getElementById('specialtyRequestResult');
    const endpointsList = document.getElementById('endpointsList');
    const testAllEndpoints = document.getElementById('testAllEndpoints');
    const clearResults = document.getElementById('clearResults');
    
    console.log('API Testing page loaded');
    console.log('API_ENDPOINTS:', API_ENDPOINTS);
    
    // Display all endpoints
    function displayEndpoints() {
        const endpoints = [
            { name: 'Student Search', method: 'POST', url: API_ENDPOINTS.students.search },
            { name: 'Specialty Request Create', method: 'POST', url: API_ENDPOINTS.specialtyRequests.create },
            { name: 'Specialty Request List', method: 'GET', url: API_ENDPOINTS.specialtyRequests.list },
            { name: 'Admin Login', method: 'POST', url: API_ENDPOINTS.auth.login },
            { name: 'Auth Verify', method: 'GET', url: API_ENDPOINTS.auth.verify }
        ];
        
        endpointsList.innerHTML = endpoints.map(endpoint => `
            <tr>
                <td>${endpoint.name}</td>
                <td><span class="badge bg-${endpoint.method === 'GET' ? 'info' : 'warning'}">${endpoint.method}</span></td>
                <td><code>${endpoint.url}</code></td>
                <td id="status-${endpoint.name.replace(/\s/g, '')}" class="text-muted">Not tested</td>
            </tr>
        `).join('');
    }
    
    // Test student search
    testStudentSearch.addEventListener('click', async function() {
        const matricule = testMatricule.value.trim();
        if (!matricule) {
            studentSearchResult.innerHTML = '<div class="text-warning">Please enter a matricule</div>';
            return;
        }
        
        studentSearchResult.innerHTML = '<div class="text-info"><i class="fas fa-spinner fa-spin"></i> Testing...</div>';
        
        try {
            const response = await fetch(API_ENDPOINTS.students.search, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ matricule })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                studentSearchResult.innerHTML = `
                    <div class="text-success">
                        <i class="fas fa-check"></i> Success (${response.status})
                        <br><small>Found: ${data.student ? data.student.first_name + ' ' + data.student.last_name : 'No student'}</small>
                    </div>
                `;
                updateEndpointStatus('StudentSearch', 'success', response.status);
            } else {
                studentSearchResult.innerHTML = `
                    <div class="text-warning">
                        <i class="fas fa-exclamation-triangle"></i> ${response.status}: ${data.message}
                    </div>
                `;
                updateEndpointStatus('StudentSearch', 'warning', response.status);
            }
        } catch (error) {
            studentSearchResult.innerHTML = `
                <div class="text-danger">
                    <i class="fas fa-times"></i> Error: ${error.message}
                </div>
            `;
            updateEndpointStatus('StudentSearch', 'danger', 'Error');
        }
    });
    
    // Test specialty request
    testSpecialtyRequest.addEventListener('click', async function() {
        specialtyRequestResult.innerHTML = '<div class="text-info"><i class="fas fa-spinner fa-spin"></i> Testing...</div>';
        
        const testData = {
            matricule: 'ING3IA2024001',
            currentSpecialty: 'IA',
            requestedSpecialty: 'GL',
            motivation: 'Test motivation for API endpoint testing. This is a test request to verify that the specialty request endpoint is working correctly.',
            priority: 'normal'
        };
        
        try {
            const response = await fetch(API_ENDPOINTS.specialtyRequests.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                specialtyRequestResult.innerHTML = `
                    <div class="text-success">
                        <i class="fas fa-check"></i> Success (${response.status})
                        <br><small>Request ID: ${data.requestId || 'N/A'}</small>
                    </div>
                `;
                updateEndpointStatus('SpecialtyRequestCreate', 'success', response.status);
            } else {
                specialtyRequestResult.innerHTML = `
                    <div class="text-warning">
                        <i class="fas fa-exclamation-triangle"></i> ${response.status}: ${data.message}
                    </div>
                `;
                updateEndpointStatus('SpecialtyRequestCreate', 'warning', response.status);
            }
        } catch (error) {
            specialtyRequestResult.innerHTML = `
                <div class="text-danger">
                    <i class="fas fa-times"></i> Error: ${error.message}
                </div>
            `;
            updateEndpointStatus('SpecialtyRequestCreate', 'danger', 'Error');
        }
    });
    
    // Update endpoint status
    function updateEndpointStatus(endpointName, type, status) {
        const statusElement = document.getElementById(`status-${endpointName}`);
        if (statusElement) {
            const colorClass = type === 'success' ? 'text-success' : 
                              type === 'warning' ? 'text-warning' : 'text-danger';
            statusElement.innerHTML = `<span class="${colorClass}">${status}</span>`;
        }
    }
    
    // Test all endpoints
    testAllEndpoints.addEventListener('click', async function() {
        // Test student search
        testStudentSearch.click();
        
        // Wait a bit then test specialty request
        setTimeout(() => {
            testSpecialtyRequest.click();
        }, 1000);
    });
    
    // Clear results
    clearResults.addEventListener('click', function() {
        studentSearchResult.innerHTML = '';
        specialtyRequestResult.innerHTML = '';
        displayEndpoints();
    });
    
    // Initialize
    displayEndpoints();
});