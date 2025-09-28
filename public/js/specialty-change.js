// Specialty Change Application
let currentStudent = null;
let selectedSpecialty = null;

// DOM Elements
let matriculeInput, confirmMatriculeBtn, studentInfo, alertsContainer, searchLoading, confirmationMessage, continueSection;
let step1, step2, step3, successStep;

// Debounce timer for real-time search
let searchTimeout = null;
let isMatriculeConfirmed = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== SPECIALTY CHANGE PAGE DEBUG ===');
    console.log('DOM loaded, setting up event listeners');
    
    // Initialize DOM elements
    matriculeInput = document.getElementById('matricule');
    confirmMatriculeBtn = document.getElementById('confirmMatricule');
    studentInfo = document.getElementById('studentInfo');
    alertsContainer = document.getElementById('alerts-container');
    searchLoading = document.getElementById('searchLoading');
    confirmationMessage = document.getElementById('confirmationMessage');
    continueSection = document.getElementById('continueSection');
    
    step1 = document.getElementById('step1');
    step2 = document.getElementById('step2');
    step3 = document.getElementById('step3');
    successStep = document.getElementById('successStep');
    
    // Debug input field
    console.log('Matricule input element:', matriculeInput);
    console.log('Input disabled:', matriculeInput?.disabled);
    console.log('Input readonly:', matriculeInput?.readOnly);
    console.log('Input tabindex:', matriculeInput?.tabIndex);
    
    // Add focus debugging
    if (matriculeInput) {
        matriculeInput.addEventListener('focus', function() {
            console.log('✅ Matricule input focused - ready for typing!');
        });
        
        matriculeInput.addEventListener('click', function() {
            console.log('✅ Matricule input clicked');
        });
        
        matriculeInput.addEventListener('keydown', function(e) {
            console.log('✅ Keydown event:', e.key);
        });
    }
    
    setupEventListeners();
    
    // Auto-focus the matricule input after a short delay
    setTimeout(() => {
        if (matriculeInput) {
            matriculeInput.focus();
            console.log('🎯 Auto-focused matricule input');
        }
    }, 500);
});

function setupEventListeners() {
    // Real-time search as user types
    matriculeInput.addEventListener('input', function(e) {
        const matricule = e.target.value.trim();
        
        // Reset confirmation state when input changes
        isMatriculeConfirmed = false;
        confirmMatriculeBtn.disabled = true;
        continueSection.style.display = 'none';
        confirmationMessage.style.display = 'none';
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Hide student info and clear alerts when input changes
        if (matricule.length === 0) {
            studentInfo.style.display = 'none';
            searchLoading.style.display = 'none';
            clearAlerts();
            currentStudent = null;
            return;
        }
        
        // Search after user stops typing for 500ms
        searchTimeout = setTimeout(() => {
            if (matricule.length >= 8) { // Minimum matricule length
                searchStudentRealTime(matricule);
            } else {
                studentInfo.style.display = 'none';
                searchLoading.style.display = 'none';
                if (matricule.length > 0) {
                    showAlert('Veuillez entrer un numéro de matricule complet (minimum 8 caractères)', 'info');
                }
            }
        }, 500);
    });

    // Confirm matricule button
    confirmMatriculeBtn.addEventListener('click', function() {
        if (currentStudent && !isMatriculeConfirmed) {
            confirmMatricule();
        }
    });

    // Navigation
    document.getElementById('continueToStep2').addEventListener('click', () => {
        if (isMatriculeConfirmed) {
            showStep(2);
        } else {
            showAlert('Veuillez d\'abord confirmer votre matricule.', 'warning');
        }
    });
    document.getElementById('backToStep1').addEventListener('click', () => showStep(1));
    document.getElementById('continueToStep3').addEventListener('click', () => showStep(3));
    document.getElementById('backToStep2').addEventListener('click', () => showStep(2));

    // Specialty selection
    document.querySelectorAll('.specialty-card').forEach(card => {
        card.addEventListener('click', function() {
            selectSpecialty(this.dataset.specialty);
        });
    });

    // Submit request
    document.getElementById('submitRequest').addEventListener('click', submitRequest);
}

async function searchStudentRealTime(matricule) {
    try {
        // Show loading indicator
        searchLoading.style.display = 'block';
        studentInfo.style.display = 'none';
        clearAlerts();
        
        const response = await fetch(API_ENDPOINTS.students.search, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricule })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            currentStudent = data.student;
            displayStudentInfo(data.student);
            searchLoading.style.display = 'none';
        } else {
            searchLoading.style.display = 'none';
            showAlert(data.message || 'Étudiant non trouvé avec ce matricule.', 'warning');
        }
    } catch (error) {
        console.error('Search error:', error);
        searchLoading.style.display = 'none';
        showAlert('Erreur lors de la recherche. Vérifiez votre connexion.', 'danger');
    }
}

async function searchStudent() {
    const matricule = matriculeInput.value.trim();
    
    if (!matricule) {
        showAlert('Veuillez entrer votre numéro de matricule.', 'warning');
        return;
    }

    await searchStudentRealTime(matricule);
}

function displayStudentInfo(student) {
    currentStudent = student;
    
    document.getElementById('studentName').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('studentMatricule').textContent = student.matricule;
    document.getElementById('currentSpecialty').textContent = getSpecialtyName(student.current_specialty);
    document.getElementById('studentSection').textContent = `${student.palier} ${student.current_specialty} ${student.section}`;
    
    // Add fade-in animation
    studentInfo.style.opacity = '0';
    studentInfo.style.display = 'block';
    
    // Enable confirmation button since we have valid student data
    confirmMatriculeBtn.disabled = false;
    
    // Hide continue section and confirmation message initially
    continueSection.style.display = 'none';
    confirmationMessage.style.display = 'none';
    
    // Reset confirmation state
    isMatriculeConfirmed = false;
    
    // Animate the appearance
    setTimeout(() => {
        studentInfo.style.transition = 'opacity 0.3s ease-in-out';
        studentInfo.style.opacity = '1';
    }, 100);
    
    clearAlerts();
    
    // Show success message with instruction to confirm
    showAlert(`✅ Étudiant trouvé: ${student.first_name} ${student.last_name}. Cliquez sur "Confirmer le matricule" pour continuer.`, 'success');
}

function confirmMatricule() {
    if (!currentStudent) return;
    
    // Set confirmation state
    isMatriculeConfirmed = true;
    
    // Show confirmation message
    confirmationMessage.style.display = 'block';
    
    // Show continue section
    continueSection.style.display = 'block';
    
    // Disable confirm button to prevent double confirmation
    confirmMatriculeBtn.disabled = true;
    confirmMatriculeBtn.textContent = 'Matricule Confirmé ✓';
    confirmMatriculeBtn.classList.remove('btn-primary');
    confirmMatriculeBtn.classList.add('btn-success');
    
    // Show success alert
    showAlert('Matricule confirmé avec succès! Vous pouvez maintenant continuer.', 'success');
}

function showStep(stepNumber) {
    // Hide all steps
    [step1, step2, step3, successStep].forEach(step => {
        step.style.display = 'none';
    });

    // Show selected step
    switch (stepNumber) {
        case 1:
            step1.style.display = 'block';
            break;
        case 2:
            step2.style.display = 'block';
            // Filter out current specialty
            filterSpecialtyOptions();
            break;
        case 3:
            step3.style.display = 'block';
            break;
        case 'success':
            successStep.style.display = 'block';
            break;
    }
}

function filterSpecialtyOptions() {
    document.querySelectorAll('.specialty-card').forEach(card => {
        const specialty = card.dataset.specialty;
        if (specialty === currentStudent.current_specialty) {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }
    });
}

function selectSpecialty(specialty) {
    selectedSpecialty = specialty;
    
    // Update UI
    document.querySelectorAll('.specialty-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelector(`[data-specialty="${specialty}"]`).classList.add('selected');
    document.getElementById('continueToStep3').disabled = false;
}

async function submitRequest() {
    const motivation = document.getElementById('motivation').value.trim();
    const priority = document.getElementById('priority').value;

    if (motivation.length < 100) {
        showAlert('La motivation doit contenir au moins 100 caractères.', 'warning');
        return;
    }

    try {
        const submitButton = document.getElementById('submitRequest');
        showLoading(submitButton);

        const response = await fetch(API_ENDPOINTS.specialtyRequests.create, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matricule: currentStudent.matricule,
                currentSpecialty: currentStudent.current_specialty,
                requestedSpecialty: selectedSpecialty,
                motivation,
                priority
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('requestId').textContent = `#${data.requestId}`;
            showStep('success');
        } else {
            showAlert(data.message || 'Erreur lors de la soumission.', 'danger');
        }
    } catch (error) {
        console.error('Submit error:', error);
        showAlert('Erreur lors de la soumission. Veuillez réessayer.', 'danger');
    } finally {
        hideLoading(document.getElementById('submitRequest'));
    }
}

function getSpecialtyName(code) {
    const names = {
        'IA': 'Intelligence Artificielle',
        'SECU': 'Cybersécurité',
        'GL': 'Génie Logiciel'
    };
    return names[code] || code;
}

function showAlert(message, type) {
    clearAlerts();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertsContainer.appendChild(alert);
}

function clearAlerts() {
    alertsContainer.innerHTML = '';
}

function showLoading(button) {
    button.disabled = true;
    button.querySelector('.loading').style.display = 'inline-block';
}

function hideLoading(button) {
    button.disabled = false;
    button.querySelector('.loading').style.display = 'none';
}