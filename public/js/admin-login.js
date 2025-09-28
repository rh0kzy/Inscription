// Admin Login Script
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const loading = loginBtn.querySelector('.loading');
    const alertContainer = document.getElementById('alertContainer');

    function showAlert(message) {
        alertContainer.innerHTML = `
            <div class="alert alert-error show">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;
    }

    function hideAlert() {
        alertContainer.innerHTML = '';
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            loading.classList.add('show');
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            loading.classList.remove('show');
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideAlert();

        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Store token in localStorage
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('adminUser', JSON.stringify(result.user));
                
                console.log('Login successful, redirecting to admin dashboard');
                // Redirect to admin dashboard
                window.location.replace('/admin.html');
            } else {
                showAlert(result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        console.log('Token found, verifying...');
        // Verify token
        fetch(API_ENDPOINTS.auth.verify, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('Token valid, redirecting to admin dashboard');
                window.location.replace('/admin.html');
            } else {
                console.log('Token invalid, removing from storage');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
            }
        }).catch((error) => {
            console.error('Token verification error:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        });
    }
});