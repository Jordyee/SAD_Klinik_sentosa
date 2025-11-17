// Login Module JavaScript

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

// Demo accounts
const demoAccounts = {
    pasien: { username: 'pasien', password: 'pasien123', role: 'pasien' },
    admin: { username: 'admin', password: 'admin123', role: 'admin' },
    dokter: { username: 'dokter', password: 'dokter123', role: 'dokter' },
    perawat: { username: 'perawat', password: 'perawat123', role: 'perawat' },
    apotek: { username: 'apotek', password: 'apotek123', role: 'apotek' },
    pemilik: { username: 'pemilik', password: 'pemilik123', role: 'pemilik' }
};

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const selectedRole = document.querySelector('input[name="role"]:checked').value;
        
        // Check if credentials match demo account
        const account = demoAccounts[selectedRole];
        
        if (account && username === account.username && password === account.password) {
            // Save user session
            const userSession = {
                username: username,
                role: selectedRole,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('userSession', JSON.stringify(userSession));
            
            // Redirect based on role
            redirectBasedOnRole(selectedRole);
        } else {
            // Check if user entered any demo account
            let found = false;
            for (const [role, account] of Object.entries(demoAccounts)) {
                if (username === account.username && password === account.password) {
                    const userSession = {
                        username: username,
                        role: role,
                        loginTime: new Date().toISOString()
                    };
                    localStorage.setItem('userSession', JSON.stringify(userSession));
                    redirectBasedOnRole(role);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                alert('Username atau password salah!\n\nGunakan akun demo yang tersedia.');
            }
        }
    });
});

// Redirect based on role
function redirectBasedOnRole(role) {
    switch(role) {
        case 'pasien':
            window.location.href = '../index.html';
            break;
        case 'admin':
            window.location.href = 'register.html';
            break;
        case 'dokter':
            window.location.href = 'examination.html';
            break;
        case 'perawat':
            window.location.href = 'examination.html';
            break;
        case 'apotek':
            window.location.href = 'pharmacy.html';
            break;
        case 'pemilik':
            window.location.href = 'reports.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}

// Check if user is already logged in
function checkExistingSession() {
    const session = localStorage.getItem('userSession');
    if (session) {
        const userSession = JSON.parse(session);
        redirectBasedOnRole(userSession.role);
    }
}

// Initialize
checkExistingSession();


