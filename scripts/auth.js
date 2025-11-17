// Authentication and Role Management

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
    window.location.href = 'pages/login.html';
}

// Check role and redirect if not authorized
function requireRole(allowedRoles) {
    const currentRole = getCurrentRole();
    
    if (!currentRole) {
        window.location.href = 'pages/login.html';
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
// Otomatis menyesuaikan base path (dipanggil dari index.html atau dari folder pages/)
function redirectBasedOnRole(role) {
    // Deteksi apakah saat ini berada di dalam folder pages atau di root
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const base = inPagesFolder ? '' : 'pages/';

    switch(role) {
        case 'pasien':
            // Pasien kembali ke beranda utama
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
        // Show login button or redirect to login
        const userIcon = document.querySelector('.user-icon');
        if (userIcon) {
            userIcon.onclick = function() {
                window.location.href = 'pages/login.html';
            };
        }
        return;
    }
    
    const role = user.role;
    
    // Update user icon with role info
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.innerHTML = `
            <i class="fas ${getRoleIcon(role)}"></i>
            <span class="user-role-badge">${getRoleDisplayName(role)}</span>
        `;
        userIcon.title = `Masuk sebagai: ${getRoleDisplayName(role)}`;
    }
    
    // Show/hide elements based on role
    hideUnauthorizedElements(role);
    
    // Add logout functionality
    addLogoutOption();
}

// Hide elements not accessible by current role
function hideUnauthorizedElements(role) {
    // Define role permissions
    const rolePermissions = {
        'pasien': {
            show: ['register', 'billing'],
            hide: ['examination', 'pharmacy', 'reports']
        },
        'admin': {
            show: ['register', 'billing', 'reports'],
            hide: ['examination', 'pharmacy']
        },
        'dokter': {
            show: ['examination'],
            hide: ['register', 'pharmacy', 'billing', 'reports']
        },
        'perawat': {
            show: ['examination'],
            hide: ['register', 'pharmacy', 'billing', 'reports']
        },
        'apotek': {
            show: ['pharmacy'],
            hide: ['register', 'examination', 'billing', 'reports']
        },
        'pemilik': {
            show: ['reports'],
            hide: ['register', 'examination', 'pharmacy', 'billing']
        }
    };
    
    const permissions = rolePermissions[role];
    if (!permissions) return;
    
    // Hide navigation links
    permissions.hide.forEach(page => {
        const links = document.querySelectorAll(`a[href*="${page}"]`);
        links.forEach(link => {
            link.style.display = 'none';
        });
    });
}

// Add logout option
function addLogoutOption() {
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.onclick = function() {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                logout();
            }
        };
        userIcon.style.cursor = 'pointer';
    }
}

// Initialize on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        updateUIForRole();
    });
}


