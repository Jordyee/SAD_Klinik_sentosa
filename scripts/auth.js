// --- User Database Management (Simulated with localStorage) ---

// Initialize the user database if it doesn't exist
function initializeUsers() {
    if (!localStorage.getItem('klinikUsers')) {
        const demoAccounts = [
            { username: 'pasien', email: 'pasien@klinik.com', password: 'pasien123', role: 'pasien' },
            { username: 'admin', email: 'admin@klinik.com', password: 'admin123', role: 'admin' },
            { username: 'dokter', email: 'dokter@klinik.com', password: 'dokter123', role: 'dokter' },
            { username: 'perawat', email: 'perawat@klinik.com', password: 'perawat123', role: 'perawat' },
            { username: 'apotek', email: 'apotek@klinik.com', password: 'apotek123', role: 'apotek' },
            { username: 'pemilik', email: 'pemilik@klinik.com', password: 'pemilik123', role: 'pemilik' }
        ];
        localStorage.setItem('klinikUsers', JSON.stringify(demoAccounts));
    }
}

// Get all users from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('klinikUsers')) || [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('klinikUsers', JSON.stringify(users));
}

// Authenticate user
function authenticateUser(username, password, role) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password && u.role === role);
    if (user) {
        // On successful login, create a session
        const userSession = {
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('userSession', JSON.stringify(userSession));
        return user;
    }
    // Fallback for multi-role accounts (like admin logging in as patient)
    const anyRoleUser = users.find(u => u.username === username && u.password === password);
    if (anyRoleUser) {
        const userSession = {
            username: anyRoleUser.username,
            role: anyRoleUser.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('userSession', JSON.stringify(userSession));
        return anyRoleUser;
    }
    return null;
}

// Find user by username or email
function findUserByUsernameOrEmail(username, email) {
    const users = getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
}

// Register a new user
function registerUser(username, email, password) {
    if (findUserByUsernameOrEmail(username, email)) {
        return { success: false, message: 'Username atau email sudah terdaftar.' };
    }
    const users = getUsers();
    const newUser = {
        username,
        email,
        password,
        role: 'pasien' // New registrations are always for patients
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true, message: 'Registrasi berhasil! Silakan login.' };
}

// Create a new user (for Admins)
function createUser(username, email, password, role) {
    if (!['admin', 'dokter', 'perawat', 'apotek', 'pemilik'].includes(role)) {
        return { success: false, message: 'Role tidak valid.' };
    }
    if (findUserByUsernameOrEmail(username, email)) {
        return { success: false, message: 'Username atau email sudah terdaftar.' };
    }
    const users = getUsers();
    const newUser = { username, email, password, role };
    users.push(newUser);
    saveUsers(users);
    return { success: true, message: `Akun untuk role ${role} berhasil dibuat.` };
}


// --- Session and UI Management ---

// Get current user session
function getCurrentUser() {
    const session = localStorage.getItem('userSession');
    if (session) {
        return JSON.parse(session);
    }
    return null;
}

// Get current role
function getCurrentRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Logout function
function logout() {
    localStorage.removeItem('userSession');
    const inPagesFolder = window.location.pathname.includes('/pages/');
    if (inPagesFolder) {
        window.location.href = 'login.html'; // Already in pages folder
    } else {
        window.location.href = 'pages/login.html'; // In root, need to go into pages
    }
}

// Check role and redirect if not authorized
function requireRole(allowedRoles) {
    const currentRole = getCurrentRole();
    
    if (!currentRole) {
        const inPagesFolder = window.location.pathname.includes('/pages/');
        window.location.href = inPagesFolder ? 'login.html' : 'pages/login.html';
        return false;
    }
    
    if (!allowedRoles.includes(currentRole)) {
        alert(`Akses ditolak! Role ${currentRole} tidak memiliki akses ke halaman ini.`);
        redirectBasedOnRole(currentRole);
        return false;
    }
    
    return true;
}

// Redirect based on role
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

// Get role display name
function getRoleDisplayName(role) {
    const roleNames = {
        'pasien': 'Pasien',
        'admin': 'Petugas Administrasi',
        'dokter': 'Dokter',
        'perawat': 'Perawat',
        'apotek': 'Petugas Apotek',
        'pemilik': 'Pemilik Klinik'
    };
    return roleNames[role] || role;
}

// Get role icon
function getRoleIcon(role) {
    const roleIcons = {
        'pasien': 'fa-user',
        'admin': 'fa-user-shield',
        'dokter': 'fa-user-md',
        'perawat': 'fa-user-nurse',
        'apotek': 'fa-pills',
        'pemilik': 'fa-user-tie'
    };
    return roleIcons[role] || 'fa-user';
}

// Update UI based on role
function updateUIForRole() {
    const user = getCurrentUser();
    if (!user) {
        const userIcon = document.querySelector('.user-icon');
        if (userIcon) {
            userIcon.onclick = function() {
                const inPagesFolder = window.location.pathname.includes('/pages/');
                window.location.href = inPagesFolder ? 'login.html' : 'pages/login.html';
            };
        }
        return;
    }
    
    const role = user.role;
    
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.innerHTML = `
            <i class="fas ${getRoleIcon(role)}"></i>
            <span class="user-role-badge">${getRoleDisplayName(role)}</span>
        `;
        userIcon.title = `Masuk sebagai: ${getRoleDisplayName(role)}`;
    }
    
    hideUnauthorizedElements(role);
    setupUserIcon();
}

// Hide elements not accessible by current role
function hideUnauthorizedElements(role) {
    const rolePermissions = {
        'pasien': { show: ['register', 'billing'], hide: ['examination', 'pharmacy', 'reports'] },
        'admin': { show: ['register', 'billing', 'reports'], hide: ['examination', 'pharmacy'] },
        'dokter': { show: ['examination'], hide: ['register', 'pharmacy', 'billing', 'reports'] },
        'perawat': { show: ['examination'], hide: ['register', 'pharmacy', 'billing', 'reports'] },
        'apotek': { show: ['pharmacy'], hide: ['register', 'examination', 'billing', 'reports'] },
        'pemilik': { show: ['reports'], hide: ['register', 'examination', 'pharmacy', 'billing'] }
    };
    
    const permissions = rolePermissions[role];
    if (!permissions) return;
    
    permissions.hide.forEach(page => {
        const links = document.querySelectorAll(`a[href*="${page}"]`);
        links.forEach(link => {
            if (link.parentElement.tagName === 'LI') {
                link.parentElement.style.display = 'none';
            } else {
                link.style.display = 'none';
            }
        });
    });
}

// Setup user icon with dropdown menu
function setupUserIcon() {
    const userIcon = document.querySelector('.user-icon');
    if (!userIcon) return;

    // Create dropdown if it doesn't exist
    let dropdown = userIcon.querySelector('.user-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        userIcon.appendChild(dropdown);
    }

    const inPagesFolder = window.location.pathname.includes('/pages/');
    const dashboardPath = inPagesFolder ? 'dashboard.html' : 'pages/dashboard.html';

    dropdown.innerHTML = `
        <a href="${dashboardPath}" class="dropdown-item"><i class="fas fa-user-cog"></i> Lihat Profil</a>
        <a href="#" id="logoutButton" class="dropdown-item"><i class="fas fa-sign-out-alt"></i> Logout</a>
    `;

    // Toggle dropdown
    userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // Logout button
    document.getElementById('logoutButton').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            logout();
        }
    });

    // Hide dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });
}

// Initialize on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeUsers(); // Ensure users DB is initialized
        updateUIForRole();
    });
}


