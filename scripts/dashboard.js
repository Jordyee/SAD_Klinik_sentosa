document.addEventListener('DOMContentLoaded', function() {
    requireRole(['pasien', 'admin', 'dokter', 'perawat', 'apotek', 'pemilik']);
    renderDashboard();
});

function renderDashboard() {
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('dashboardContent').innerHTML = '<p>Sesi tidak ditemukan. Silakan login kembali.</p>';
        return;
    }

    const contentEl = document.getElementById('dashboardContent');
    const subtitleEl = document.getElementById('dashboardSubtitle');
    subtitleEl.textContent = `Informasi untuk ${getRoleDisplayName(user.role)}: ${user.username}`;

    switch (user.role) {
        case 'pasien':
            renderPatientDashboard(contentEl, user);
            break;
        case 'admin':
            renderAdminDashboard(contentEl, user);
            break;
        case 'dokter':
            renderStaffDashboard(contentEl, user);
            break;
        case 'perawat':
            renderStaffDashboard(contentEl, user);
            break;
        // Add other roles as needed
        default:
            renderStaffDashboard(contentEl, user);
            break;
    }
}

function renderPatientDashboard(container, user) {
    const patientData = findPatientByUsername(user.username);
    if (patientData) {
        container.innerHTML = `
            <div class="dashboard-card">
                <h3>Profil Pasien</h3>
                <p><strong>Nama:</strong> ${patientData.nama}</p>
                <p><strong>ID Pasien:</strong> ${patientData.patientId}</p>
                <p><strong>Alamat:</strong> ${patientData.alamat}</p>
                <p><strong>No. Telepon:</strong> ${patientData.no_telp}</p>
                <p><strong>Status Keanggotaan:</strong> ${patientData.status_pasien}</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="dashboard-card">
                <h3>Profil Pasien</h3>
                <p>Data klinis Anda belum terdaftar. Silakan pergi ke halaman <strong>Pendaftaran</strong> untuk melengkapi data Anda.</p>
            </div>
        `;
    }
}

function renderAdminDashboard(container, user) {
    const queue = getQueue();
    const users = getUsers();
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Profil Admin</h3>
                <p><strong>Username:</strong> ${user.username}</p>
                <p>Anda memiliki akses penuh ke semua modul administrasi.</p>
            </div>
            <div class="dashboard-card">
                <h3>Statistik Cepat</h3>
                <p><strong>Jumlah Pengguna Terdaftar:</strong> ${users.length}</p>
                <p><strong>Pasien dalam Antrian Aktif:</strong> ${queue.filter(p => p.status !== 'Selesai').length}</p>
            </div>
        </div>
    `;
}

function renderStaffDashboard(container, user) {
    container.innerHTML = `
        <div class="dashboard-card">
            <h3>Profil Staff</h3>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Role:</strong> ${getRoleDisplayName(user.role)}</p>
            <p>Gunakan menu navigasi di atas untuk mengakses modul yang relevan dengan pekerjaan Anda.</p>
        </div>
    `;
}
