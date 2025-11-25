// --- Page Initialization and Role Handling ---

document.addEventListener('DOMContentLoaded', function () {
    console.log('Register.js loaded - Version 2 (API Integration)');
    if (!requireRole(['admin', 'pasien'])) {
        return;
    }

    const user = getCurrentUser();
    if (user && user.role === 'admin') {
        const adminOnlyTabs = document.querySelectorAll('.admin-only');
        adminOnlyTabs.forEach(tab => tab.style.display = 'inline-flex');
        displayUserList();
    }

    handlePatientRoleView();
    setupFormListeners();
    displayQueue();
});

// Handle UI for patient vs admin
async function handlePatientRoleView() {
    const user = getCurrentUser();
    if (!user || user.role !== 'pasien') {
        return;
    }

    // Check if patient data exists for this user
    // We assume username is unique and can be used to find patient if linked
    // In the new backend, we might need a way to link user to patient explicitly.
    // For now, let's search by name matching username or NIK if we had it.
    // The backend `getPatients` supports search.

    // Strategy: Search for patient with name == user.fullName (which is username for now)
    // Or, we can just let them register.
    // If we want to prevent double registration, we should check.

    const patients = await fetchPatients(user.username);
    const existingPatientData = patients.find(p => p.name.toLowerCase() === user.username.toLowerCase());

    const newPatientTab = document.querySelector('.tab-btn[data-tab="new"]');
    const existingPatientTabButton = document.querySelector('.tab-btn[data-tab="existing"]');
    const registrationInfo = document.getElementById('registrationInfo');

    if (existingPatientData) {
        // Hide the "New Patient" tab button and its content
        if (newPatientTab) newPatientTab.style.display = 'none';
        document.getElementById('new-tab').classList.remove('active');

        // Update the info message
        const infoContainer = document.getElementById('new-tab').querySelector('.form-container');
        if (infoContainer) {
            infoContainer.innerHTML = `<div class="info-static"><h3>Data Pasien Anda Sudah Terdaftar</h3><p>Gunakan tab "Pasien Lama" untuk masuk antrian.</p></div>`;
        }

        // Programmatically switch to the "Existing Patient" tab
        if (existingPatientTabButton) {
            existingPatientTabButton.click();
        }

    } else {
        if (registrationInfo) {
            registrationInfo.innerHTML = '<p>Data pasien Anda belum terdaftar. Silakan isi formulir di bawah ini.</p>';
        }
    }
}

// --- Form and Event Listeners ---

function setupFormListeners() {
    const newPatientForm = document.getElementById('newPatientForm');
    if (newPatientForm) newPatientForm.addEventListener('submit', handleNewPatientSubmit);

    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) createUserForm.addEventListener('submit', handleCreateUserSubmit);

    // New, robust tab switching logic
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Deactivate all tabs and content
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Activate the selected tab and content
            tab.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Search Listener
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchPatient(e.target.value);
        });
    }
}

async function handleNewPatientSubmit(e) {
    e.preventDefault();
    const user = getCurrentUser();

    const patientData = {
        nik: 'NIK-' + Date.now(),
        name: document.getElementById('nama').value,
        address: document.getElementById('alamat').value,
        phone: document.getElementById('no_telp').value,
        dob: '1990-01-01', // Default
        gender: 'L', // Default
        insuranceType: document.getElementById('status_pasien').value
    };

    if (!patientData.name || !patientData.address || !patientData.phone || !patientData.insuranceType) {
        Swal.fire('Peringatan', 'Mohon lengkapi semua data wajib (*)', 'warning');
        return;
    }

    try {
        // 1. Register Patient
        const response = await fetch(`${API_BASE_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const newPatient = result.patient;

        // 2. Add to Queue
        const queueResponse = await fetch(`${API_BASE_URL}/patients/visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: newPatient.id })
        });
        const queueResult = await queueResponse.json();

        if (!queueResult.success) {
            throw new Error(queueResult.message);
        }

        Swal.fire({
            title: 'Pendaftaran Berhasil!',
            html: `ID Pasien: <strong>${newPatient.id}</strong><br>Nomor Antrian: <strong>#${queueResult.visit.queueNumber}</strong>`,
            icon: 'success'
        });

        if (user && user.role === 'pasien') handlePatientRoleView();
        else resetForm('newPatientForm');

        displayQueue();

    } catch (error) {
        Swal.fire('Gagal', error.message, 'error');
    }
}

async function handleCreateUserSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.querySelector('#newUsername').value;
    const email = form.querySelector('#newEmail').value;
    const password = form.querySelector('#newPassword').value;
    const role = form.querySelector('#newRole').value;

    if (!username || !email || !password || !role) {
        Swal.fire('Peringatan', 'Semua field wajib diisi.', 'warning');
        return;
    }

    // Use the function from auth.js which now calls API
    const result = await createUser(username, email, password, role);

    if (result.success) {
        Swal.fire('Berhasil', result.message, 'success');
        form.reset();
        displayUserList();
    } else {
        Swal.fire('Gagal', result.message, 'error');
    }
}

// --- User Management (Admin) ---
async function displayUserList() {
    const userListContainer = document.getElementById('userList');
    if (!userListContainer) return;

    // Use getUsers from auth.js (API)
    const users = await getUsers();
    const currentUser = getCurrentUser();

    userListContainer.innerHTML = `
        <table class="stock-table">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Aksi</th></tr></thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email || '-'}</td>
                        <td>${user.role}</td>
                        <td>
                            ${user.username !== currentUser.username ? `
                            <button class="btn-action btn-danger" onclick="deleteUser('${user.id}')">
                                <i class="fas fa-trash"></i> Hapus
                            </button>` : 'Tidak ada aksi'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteUser(userId) {
    Swal.fire({
        title: `Yakin ingin menghapus pengguna?`,
        text: "Aksi ini tidak dapat dibatalkan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const removeResult = await removeUser(userId); // from auth.js
            if (removeResult.success) {
                Swal.fire('Dihapus!', removeResult.message, 'success');
                displayUserList();
            } else {
                Swal.fire('Gagal', removeResult.message, 'error');
            }
        }
    });
}


// --- Patient Search (for Pasien Lama tab) ---
async function fetchPatients(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/patients?search=${query}`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        return await response.json();
    } catch (error) {
        console.error('Error fetching patients:', error);
        return [];
    }
}

async function searchPatient(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!query) {
        resultsContainer.innerHTML = `<div class="empty-state"><p>Masukkan kata kunci untuk mencari pasien.</p></div>`;
        return;
    }

    const results = await fetchPatients(query);

    if (results.length === 0) {
        resultsContainer.innerHTML = `<div class="empty-state"><p>Pasien tidak ditemukan.</p></div>`;
        return;
    }
    resultsContainer.innerHTML = results.map(patient => `
        <div class="patient-card">
            <h4>${patient.name} (ID: ${patient.id})</h4>
            <p>NIK: ${patient.nik}</p>
            <button class="btn-submit" onclick="selectPatient('${patient.id}')"><i class="fas fa-plus"></i> Tambah ke Antrian</button>
        </div>
    `).join('');
}

// --- Queue Management ---
async function selectPatient(patientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/patients/visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire('Berhasil', `Pasien telah ditambahkan ke antrian dengan nomor #${result.visit.queueNumber}.`, 'success');
            displayQueue();
        } else {
            Swal.fire('Info', result.message, 'info');
        }
    } catch (error) {
        Swal.fire('Error', 'Gagal menambahkan ke antrian', 'error');
    }
}

async function getQueue() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients/visits/active`);
        if (!response.ok) throw new Error('Failed to fetch queue');
        return await response.json();
    } catch (error) {
        console.error('Error fetching queue:', error);
        return [];
    }
}

function getStatusInfo(status) {
    const statusMap = {
        'Waiting': { text: 'Menunggu Pemeriksaan', class: 'status-waiting' },
        'Examining': { text: 'Sedang Diperiksa', class: 'status-examining' },
        'Pharmacy': { text: 'Menunggu Obat', class: 'status-pharmacy' },
        'Cashier': { text: 'Menunggu Pembayaran', class: 'status-billing' },
        'Done': { text: 'Selesai', class: 'status-completed' },
    };
    return statusMap[status] || { text: status, class: 'status-unknown' };
}

async function displayQueue() {
    const queueList = document.getElementById('queueList');
    const queue = await getQueue();
    const currentUser = getCurrentUser();

    if (queue.length === 0) {
        queueList.innerHTML = `<div class="empty-state"><p>Belum ada pasien dalam antrian aktif.</p></div>`;
        return;
    }

    queueList.innerHTML = queue.map(item => {
        const statusInfo = getStatusInfo(item.status);
        // Note: We don't have full patient details in visit object, just patientName. 
        // If we need more details for admin modal, we might need to fetch patient details separately or include them in visit.
        // For now, let's use what we have.

        const adminButton = (currentUser && currentUser.role === 'admin')
            ? `<button class="btn-action btn-sm" onclick="showPatientDetails('${item.patientId}')"><i class="fas fa-eye"></i> Detail</button>`
            : '';

        return `
            <div class="queue-item">
                <div class="queue-number">#${item.queueNumber}</div>
                <div class="queue-info">
                    <div class="queue-name">${item.patientName}</div>
                    <div class="queue-details">ID: ${item.patientId}</div>
                </div>
                <div class="queue-status ${statusInfo.class}">${statusInfo.text}</div>
                <div class="queue-actions">${adminButton}</div>
            </div>
        `;
    }).join('');
}

async function showPatientDetails(patientId) {
    const modal = document.getElementById('patientDetailModal');
    const body = document.getElementById('patientDetailBody');
    const nameEl = document.getElementById('modalPatientName');

    // Fetch patient details
    try {
        const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
        const patientData = await response.json();

        // Find visit info
        const queue = await getQueue();
        const queueItem = queue.find(item => item.patientId === patientId);

        if (!patientData || !modal || !body || !nameEl) {
            console.error('Could not find patient data or modal elements.');
            return;
        }

        nameEl.textContent = `Detail Pasien: ${patientData.name}`;
        body.innerHTML = `
            <div class="patient-detail-grid">
                <div><strong>ID Pasien:</strong></div><div>${patientData.id}</div>
                <div><strong>Nama:</strong></div><div>${patientData.name}</div>
                <div><strong>Alamat:</strong></div><div>${patientData.address}</div>
                <div><strong>No. Telepon:</strong></div><div>${patientData.phone}</div>
                <div><strong>Status Keanggotaan:</strong></div><div>${patientData.insuranceType}</div>
                <hr>
                <div><strong>No. Antrian:</strong></div><div>#${queueItem ? queueItem.queueNumber : 'N/A'}</div>
                <div><strong>Status Saat Ini:</strong></div><div>${queueItem ? queueItem.status : 'N/A'}</div>
                <div><strong>Waktu Daftar:</strong></div><div>${queueItem ? new Date(queueItem.date).toLocaleString('id-ID') : 'N/A'}</div>
            </div>
        `;

        modal.style.display = 'block';

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Gagal memuat detail pasien', 'error');
    }
}

function closePatientDetailModal() {
    const modal = document.getElementById('patientDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function refreshQueue() {
    displayQueue();
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}
