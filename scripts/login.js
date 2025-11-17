// Login & Registration Module
document.addEventListener('DOMContentLoaded', function() {
    // Ensure user database is initialized on load
    if (typeof initializeUsers === 'function') {
        initializeUsers();
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    // --- Toggle between Login and Register Views ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'none';
            registerCard.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerCard.style.display = 'none';
            loginCard.style.display = 'block';
        });
    }

    // --- Handle Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const selectedRole = document.querySelector('input[name="role"]:checked').value;
            
            const user = authenticateUser(username, password, selectedRole);
            
            if (user) {
                // Redirect based on the role stored in the user's record
                redirectBasedOnRole(user.role);
            } else {
                Swal.fire({
                    title: 'Login Gagal',
                    text: 'Username, password, atau role yang Anda pilih salah!',
                    icon: 'error'
                });
            }
        });
    }

    // --- Handle Registration Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('newUsername').value;
            const email = document.getElementById('newEmail').value;
            const password = document.getElementById('newPassword').value;

            if (!username || !email || !password) {
                Swal.fire({
                    title: 'Oops...',
                    text: 'Semua field harus diisi!',
                    icon: 'warning'
                });
                return;
            }

            const result = registerUser(username, email, password);

            if (result.success) {
                Swal.fire({
                    title: 'Registrasi Berhasil!',
                    text: result.message,
                    icon: 'success'
                }).then(() => {
                    // Show login form after successful registration
                    registerCard.style.display = 'none';
                    loginCard.style.display = 'block';
                    // Clear registration form
                    registerForm.reset();
                });
            } else {
                Swal.fire({
                    title: 'Registrasi Gagal',
                    text: result.message,
                    icon: 'error'
                });
            }
        });
    }

    // --- Password Toggle Functionality ---
    const togglePasswordBtn = document.querySelector('.toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePassword);
    }
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Redirect based on role (assuming this is in auth.js, but can be here too)
function redirectBasedOnRole(role) {
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const base = inPagesFolder ? '' : 'pages/';

    switch(role) {
        case 'pasien':
            window.location.href = inPagesFolder ? '../index.html' : 'index.html';
            break;
        case 'admin':
            window.location.href = base + 'register.html';
            break;
        case 'dokter':
            window.location.href = base + 'examination.html';
            break;
        case 'perawat':
            window.location.href = base + 'examination.html';
            break;
        case 'apotek':
            window.location.href = base + 'pharmacy.html';
            break;
        case 'pemilik':
            window.location.href = base + 'reports.html';
            break;
        default:
            window.location.href = inPagesFolder ? '../index.html' : 'index.html';
    }
}

// Check if user is already logged in and redirect
(function checkExistingSession() {
    const session = localStorage.getItem('userSession');
    if (session) {
        const userSession = JSON.parse(session);
        // Don't redirect if we are on the login page itself
        if (!window.location.pathname.includes('login.html')) {
             redirectBasedOnRole(userSession.role);
        }
    }
})();


