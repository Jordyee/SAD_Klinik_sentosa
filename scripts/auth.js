// --- User Database Management (API Integration) ---

// Initialize the user database if it doesn't exist
// DEPRECATED: Users are now managed by the backend.
function initializeUsers() {
    console.log('User initialization handled by backend.');
}

// Get all users from API
async function getUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Authenticate user
async function authenticateUser(username, password, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (data.success) {
            // On successful login, create a session
            const userSession = {
                id: data.user.id,
                username: data.user.username,
                role: data.user.role,
                fullName: data.user.fullName,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('userSession', JSON.stringify(userSession));
            return userSession;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

// Register a new user (Pasien)
async function registerUser(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                role: 'pasien',
                fullName: username // Default fullName to username for now
            })
        });

        const data = await response.json();
        return data; // { success: true/false, message: ... }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Terjadi kesalahan koneksi.' };
    }
}

// Create a new user (for Admins)
async function createUser(username, email, password, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                role,
                fullName: username
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Create user error:', error);
        return { success: false, message: 'Terjadi kesalahan koneksi.' };
    }
}

// Remove a user (for Admins)
async function removeUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Delete user error:', error);
        return { success: false, message: 'Terjadi kesalahan koneksi.' };
    }
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
        Swal.fire({
            title: 'Akses Ditolak!',
            text: `Role ${currentRole} tidak memiliki akses ke halaman ini.`,
            icon: 'error',
            timer: 3000,
            timerProgressBar: true
        }).then(() => {
            redirectBasedOnRole(currentRole);
        });
        return false;
    }

    return true;
}

// Redirect based on role
function redirectBasedOnRole(role) {
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const base = inPagesFolder ? '' : 'pages/';

    switch (role) {
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
            userIcon.onclick = function () {
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
        'pasien': { show: ['register'], hide: ['examination', 'pharmacy', 'reports', 'billing'] },
        'admin': { show: ['register', 'billing', 'reports'], hide: ['examination', 'pharmacy'] },
        'dokter': { show: ['examination'], hide: ['register', 'pharmacy', 'billing', 'reports'] },
        'perawat': { show: ['examination'], hide: ['register', 'pharmacy', 'billing', 'reports'] },
        'apotek': { show: ['pharmacy'], hide: ['register', 'examination', 'billing', 'reports'] },
        'pemilik': { show: ['reports'], hide: ['register', 'examination', 'pharmacy', 'billing'] }
    };

    const permissions = rolePermissions[role];
    if (!permissions) return;

    // Hide nav links and buttons
    permissions.hide.forEach(page => {
        // Hide links
        const links = document.querySelectorAll(`a[href*="${page}"]`);
        links.forEach(link => {
            link.style.display = 'none';
        });

        // Hide buttons that navigate to this page (e.g. Billing button)
        const buttons = document.querySelectorAll(`button[onclick*="${page}"]`);
        buttons.forEach(btn => {
            btn.style.display = 'none';
        });
    });

    // Special rule for pharmacist: hide payment button in header
    if (role === 'apotek') {
        const paymentButton = document.querySelector("button.btn-primary[onclick*='billing.html']");
        if (paymentButton) {
            paymentButton.style.display = 'none';
        }
    }
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
        Swal.fire({
            title: 'Anda yakin ingin keluar?',
            text: "Anda akan dikembalikan ke halaman login.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, keluar!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
            }
        });
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
    document.addEventListener('DOMContentLoaded', function () {
        // initializeUsers(); // No longer needed
        updateUIForRole();
    });
}
