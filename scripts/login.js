// Login & Registration Module with Firebase Authentication
// Handles login form, registration form, and Firebase integration

// ==============================================
// FORM TOGGLE FUNCTIONS
// ==============================================

// Toggle between login and register forms
document.addEventListener('DOMContentLoaded', function () {
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');

    showRegisterBtn.addEventListener('click', function (e) {
        e.preventDefault();
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
    });

    showLoginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
    });
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

// ==============================================
// LOGIN FORM HANDLER
// ==============================================

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
    const password = document.getElementById('password').value;

    // Show loading
    Swal.fire({
        title: 'Memproses...',
        text: 'Sedang login ke sistem',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        let email = emailOrUsername;

        // Check if input is email or username
        if (!emailOrUsername.includes('@')) {
            // It's a username, need to lookup email from Firestore
            console.log('Looking up email for username:', emailOrUsername);

            const usersQuery = await firebaseDB.collection('users')
                .where('username', '==', emailOrUsername)
                .limit(1)
                .get();

            if (usersQuery.empty) {
                throw new Error('Username tidak ditemukan');
            }

            const userData = usersQuery.docs[0].data();
            email = userData.email;
            console.log('Found email:', email);
        }

        // Login with Firebase Auth
        const result = await loginUser(email, password);

        if (result.success) {
            const user = result.user;

            Swal.fire({
                title: 'Login Berhasil!',
                text: `Selamat datang, ${user.fullName || user.username}!`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Redirect based on role
                redirectBasedOnRole(user.role);
            });
        } else {
            throw new Error(result.message || 'Login gagal');
        }

    } catch (error) {
        console.error('Login error:', error);

        let errorMessage = 'Login gagal. Periksa username/email dan password Anda.';

        if (error.message === 'Username tidak ditemukan') {
            errorMessage = 'Username tidak ditemukan. Pastikan username benar atau gunakan email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Password salah. Silakan coba lagi.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Format email tidak valid.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        Swal.fire({
            title: 'Login Gagal',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

// ==============================================
// REGISTRATION FORM HANDLER
// ==============================================

document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fullName = document.getElementById('newFullName').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;

    // Validation
    if (username.length < 3) {
        Swal.fire({
            title: 'Username Tidak Valid',
            text: 'Username minimal 3 karakter',
            icon: 'error'
        });
        return;
    }

    if (password.length < 6) {
        Swal.fire({
            title: 'Password Terlalu Pendek',
            text: 'Password minimal 6 karakter',
            icon: 'error'
        });
        return;
    }

    // Show loading
    Swal.fire({
        title: 'Memproses...',
        text: 'Sedang membuat akun baru',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Register patient with Firebase
        const result = await registerPatient(username, email, password, fullName);

        if (result.success) {
            Swal.fire({
                title: 'Registrasi Berhasil!',
                text: result.message,
                icon: 'success',
                confirmButtonText: 'Login Sekarang'
            }).then(() => {
                // Switch back to login form
                document.getElementById('registerCard').style.display = 'none';
                document.getElementById('loginCard').style.display = 'block';

                // Pre-fill email in login form
                document.getElementById('emailOrUsername').value = email;
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            });
        } else {
            throw new Error(result.message || 'Registrasi gagal');
        }

    } catch (error) {
        console.error('Registration error:', error);

        let errorMessage = 'Registrasi gagal. Silakan coba lagi.';

        if (error.message.includes('email')) {
            errorMessage = error.message;
        } else if (error.message.includes('username')) {
            errorMessage = error.message;
        } else if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email sudah terdaftar. Gunakan email lain atau login.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Format email tidak valid.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        Swal.fire({
            title: 'Registrasi Gagal',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

// ==============================================
// AUTO-REDIRECT IF ALREADY LOGGED IN
// ==============================================

// Check if user is already logged in
if (isLoggedIn()) {
    const currentUser = getCurrentUser();
    console.log('User already logged in:', currentUser);

    Swal.fire({
        title: 'Sudah Login',
        text: `Anda sudah login sebagai ${currentUser.username}`,
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
    }).then(() => {
        redirectBasedOnRole(currentUser.role);
    });
}
