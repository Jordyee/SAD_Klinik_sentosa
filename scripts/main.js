// Klinik Sentosa - Main JavaScript
// Handles navigation, search, and interactive features

// Handle get started button (Hero "Mulai Sekarang")
// Untuk PASIEN: langsung diarahkan ke halaman pendaftaran
// Untuk role lain: diarahkan sesuai role (dokter -> pemeriksaan, dst.)
function handleGetStarted() {
    const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null;

    if (!role) {
        // Belum login, arahkan ke halaman login terlebih dahulu
        window.location.href = 'pages/login.html';
        return;
    }

    if (role === 'pasien') {
        // Pasien: fokus utama adalah pendaftaran/antrian
        window.location.href = 'pages/register.html';
        return;
    }

    // Role lain gunakan aturan umum dari auth.js
    if (typeof redirectBasedOnRole === 'function') {
        redirectBasedOnRole(role);
    } else {
        window.location.href = 'pages/register.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        // Add search icon click handler
        const searchIcon = searchInput.parentElement.querySelector('i');
        if (searchIcon) {
            searchIcon.addEventListener('click', function() {
                performSearch(searchInput.value);
            });
            searchIcon.style.cursor = 'pointer';
        }
    }

    // Header scroll effect
    let lastScroll = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });

    // Service cards hover effect enhancement
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, observerOptions);

    // Observe service cards and facility cards
    document.querySelectorAll('.service-card, .facility-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        observer.observe(card);
    });
    
    // Add click handlers to service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            if (title.includes('Pendaftaran')) {
                window.location.href = 'pages/register.html';
            } else if (title.includes('Pemeriksaan')) {
                window.location.href = 'pages/examination.html';
            } else if (title.includes('Resep') || title.includes('Obat')) {
                window.location.href = 'pages/pharmacy.html';
            } else if (title.includes('Pembayaran')) {
                window.location.href = 'pages/billing.html';
            } else if (title.includes('Laporan')) {
                window.location.href = 'pages/reports.html';
            } else if (title.includes('Stok')) {
                window.location.href = 'pages/pharmacy.html';
            }
        });
    });
});

// Search function
function performSearch(query) {
    if (!query.trim()) return;
    
    // Search across all modules
    const searchTerm = query.toLowerCase();
    const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null;

    // Helper untuk cek akses sederhana (di-level front-end)
    function canAccess(page) {
        if (!role) return true; // belum login, biarkan diarahkan lalu dicek di halaman tujuan
        if (role === 'pasien' && (page === 'examination' || page === 'pharmacy' || page === 'reports')) {
            return false;
        }
        if (role === 'dokter' && (page === 'register' || page === 'billing' || page === 'reports' || page === 'pharmacy')) {
            return false;
        }
        if (role === 'perawat' && (page === 'register' || page === 'billing' || page === 'reports' || page === 'pharmacy')) {
            return false;
        }
        if (role === 'apotek' && (page === 'register' || page === 'examination' || page === 'billing' || page === 'reports')) {
            return false;
        }
        if (role === 'pemilik' && (page === 'register' || page === 'examination' || page === 'pharmacy' || page === 'billing')) {
            return false;
        }
        return true;
    }

    // Cek keyword spesifik modul
    if (searchTerm.includes('pendaftaran') || searchTerm.includes('daftar')) {
        if (!canAccess('register')) {
            alert('Role Anda tidak memiliki akses ke halaman pendaftaran.');
            return;
        }
        window.location.href = 'pages/register.html';
        return;
    }

    if (searchTerm.includes('pemeriksaan') || searchTerm.includes('periksa')) {
        if (!canAccess('examination')) {
            alert('Role Anda tidak memiliki akses ke halaman pemeriksaan.');
            return;
        }
        window.location.href = 'pages/examination.html';
        return;
    }

    if (searchTerm.includes('apotek') || searchTerm.includes('obat')) {
        if (!canAccess('pharmacy')) {
            alert('Role Anda tidak memiliki akses ke halaman apotek.');
            return;
        }
        window.location.href = 'pages/pharmacy.html';
        return;
    }

    if (searchTerm.includes('pembayaran') || searchTerm.includes('bayar')) {
        if (!canAccess('billing')) {
            alert('Role Anda tidak memiliki akses ke halaman pembayaran.');
            return;
        }
        window.location.href = 'pages/billing.html';
        return;
    }

    if (searchTerm.includes('laporan') || searchTerm.includes('report')) {
        if (!canAccess('reports')) {
            alert('Role Anda tidak memiliki akses ke halaman laporan.');
            return;
        }
        window.location.href = 'pages/reports.html';
        return;
    }

    // Jika tidak ada keyword modul yang jelas, jangan paksa redirect
    alert(`Pencarian: "${query}"\n\nTidak ditemukan modul spesifik yang cocok. Silakan gunakan kata kunci seperti: pendaftaran, pemeriksaan, apotek, pembayaran, laporan.`);
}

// Navigation functions
function navigateToRegister() {
    window.location.href = 'pages/register.html';
}

function navigateToExamination() {
    window.location.href = 'pages/examination.html';
}

function navigateToPharmacy() {
    window.location.href = 'pages/pharmacy.html';
}

function navigateToBilling() {
    window.location.href = 'pages/billing.html';
}

function navigateToReports() {
    window.location.href = 'pages/reports.html';
}

// Handle register button click based on role
function handleRegisterClick() {
    const role = getCurrentRole();
    
    if (!role) {
        // Not logged in, redirect to login
        window.location.href = 'pages/login.html';
    } else if (role === 'admin' || role === 'pasien') {
        // Admin or Pasien can access register
        window.location.href = 'pages/register.html';
    } else {
        alert(`Role ${getRoleDisplayName(role)} tidak memiliki akses ke halaman pendaftaran.`);
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        performSearch,
        navigateToRegister,
        navigateToExamination,
        navigateToPharmacy,
        navigateToBilling,
        navigateToReports
    };
}

