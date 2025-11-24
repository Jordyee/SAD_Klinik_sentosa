// Firebase Authentication Module
// Handles user authentication, session management, and role-based access control

// ==============================================
// FIREBASE AUTHENTICATION FUNCTIONS
// ==============================================

// Login with email and password
async function loginUser(email, password) {
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get user data from Firestore
        const userDoc = await firebaseDB.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            throw new Error('User data not found in database');
        }

        const userData = userDoc.data();

        // Create session
        const userSession = {
            uid: user.uid,
            email: user.email,
            username: userData.username,
            role: userData.role,
            fullName: userData.fullName,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('userSession', JSON.stringify(userSession));

        return { success: true, user: userData };
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Login gagal. Periksa email dan password Anda.';

        if (error.code === 'auth/user-not-found') {
            message = 'Email tidak terdaftar.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Password salah.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Format email tidak valid.';
        } else if (error.code === 'auth/user-disabled') {
            message = 'Akun telah dinonaktifkan.';
        }

        return { success: false, message };
    }
}

// Register new patient (public registration)
async function registerPatient(username, email, password, fullName) {
    try {
        // Check if username already exists
        const usersQuery = await firebaseDB.collection('users')
            .where('username', '==', username)
            .get();

        if (!usersQuery.empty) {
            return { success: false, message: 'Username sudah terdaftar.' };
        }

        // Create Firebase Auth account
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await firebaseDB.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            role: 'pasien',
            fullName: fullName,
            phone: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true, message: 'Registrasi berhasil! Silakan login.' };
    } catch (error) {
        console.error('Registration error:', error);
        let message = 'Registrasi gagal. Silakan coba lagi.';

        if (error.code === 'auth/email-already-in-use') {
            message = 'Email sudah terdaftar.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Format email tidak valid.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password terlalu lemah. Minimal 6 karakter.';
        }

        return { success: false, message };
    }
}

// Create new user (for admins - staff accounts)
async function createUser(username, email, password, role, fullName) {
    const validRoles = ['admin', 'dokter', 'perawat', 'apotek', 'pemilik'];

    if (!validRoles.includes(role)) {
        return { success: false, message: 'Role tidak valid.' };
    }

    try {
        // Check if username already exists
        const usersQuery = await firebaseDB.collection('users')
            .where('username', '==', username)
            .get();

        if (!usersQuery.empty) {
            return { success: false, message: 'Username sudah terdaftar.' };
        }

        // Create Firebase Auth account
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await firebaseDB.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            role: role,
            fullName: fullName,
            phone: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true, message: `Akun untuk role ${role} berhasil dibuat.` };
    } catch (error) {
        console.error('Create user error:', error);
        let message = 'Gagal membuat akun. Silakan coba lagi.';

        if (error.code === 'auth/email-already-in-use') {
            message = 'Email sudah terdaftar.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Format email tidak valid.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password terlalu lemah. Minimal 6 karakter.';
        }

        return { success: false, message };
    }
}

// Logout function
async function logout() {
    try {
        await firebaseAuth.signOut();
        localStorage.removeItem('userSession');

        const inPagesFolder = window.location.pathname.includes('/pages/');
        if (inPagesFolder) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'pages/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==============================================
// SESSION MANAGEMENT
// ==============================================

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

// ==============================================
// ROLE-BASED ACCESS CONTROL
// ==============================================

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

// ==============================================
// UI HELPER FUNCTIONS
// ==============================================

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
        'pasien': { show: ['register'], hide: ['examination', 'pharmacy', 'reports'] },
        'admin': { show: ['register', 'billing', 'reports'], hide: ['examination', 'pharmacy'] },
        'dokter': { show: ['examination'], hide: ['register', 'pharmacy', 'billing', 'reports'] },
        'perawat': { show: ['examination'], hide: ['register', 'pharmacy', 'billing', 'reports'] },
        'apotek': { show: ['pharmacy'], hide: ['register', 'examination', 'billing', 'reports'] },
        'pemilik': { show: ['reports'], hide: ['register', 'examination', 'pharmacy', 'billing'] }
    };

    const permissions = rolePermissions[role];
    if (!permissions) return;

    // Hide nav links
    permissions.hide.forEach(page => {
        const links = document.querySelectorAll(`a[href*="${page}"]`);
        links.forEach(link => {
            if (link.parentElement.tagName === 'LI' || link.parentElement.classList.contains('nav-left')) {
                link.style.display = 'none';
            }
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
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
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
    }

    // Hide dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });
}

// ==============================================
// FIREBASE AUTH STATE LISTENER
// ==============================================

// Listen for auth state changes
firebaseAuth.onAuthStateChanged(async (user) => {
    if (user && !localStorage.getItem('userSession')) {
        // User is signed in but session not set (e.g., page refresh)
        try {
            const userDoc = await firebaseDB.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const userSession = {
                    uid: user.uid,
                    email: user.email,
                    username: userData.username,
                    role: userData.role,
                    fullName: userData.fullName,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('userSession', JSON.stringify(userSession));
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }
});

// ==============================================
// INITIALIZATION
// ==============================================

// Initialize on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        updateUIForRole();
    });
}
