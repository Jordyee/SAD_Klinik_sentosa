// --- Page Initialization and Role Handling ---

document.addEventListener('DOMContentLoaded', function() {
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
function handlePatientRoleView() {
    const user = getCurrentUser();
    if (!user || user.role !== 'pasien') {
        return;
    }

    const existingPatientData = findPatientByUsername(user.username);
    const newPatientForm = document.getElementById('newPatientForm');
    const registrationInfo = document.getElementById('registrationInfo');
    const newPatientTab = document.querySelector('.tab-btn[onclick*="new"]');

    if (existingPatientData) {
        newPatientForm.style.display = 'none';
        if(newPatientTab) newPatientTab.style.display = 'none';
        registrationInfo.innerHTML = `<div class="info-static"><h3>Data Pasien Anda Sudah Terdaftar</h3><p>Gunakan tab "Pasien Lama" untuk masuk antrian.</p></div>`;
        switchTab('existing');
    } else {
        registrationInfo.innerHTML = '<p>Data pasien Anda belum terdaftar. Silakan isi formulir di bawah ini.</p>';
    }
}

// --- Form and Event Listeners ---

function setupFormListeners() {
    const newPatientForm = document.getElementById('newPatientForm');
    if (newPatientForm) newPatientForm.addEventListener('submit', handleNewPatientSubmit);

    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) createUserForm.addEventListener('submit', handleCreateUserSubmit);
}

function handleNewPatientSubmit(e) {
    e.preventDefault();
    const user = getCurrentUser();
    let linkedUsername = (user && user.role === 'pasien') ? user.username : null;

    if (linkedUsername && findPatientByUsername(linkedUsername)) {
        alert('Anda sudah mendaftarkan data pasien.');
        return;
    }

    let allPatientData = getPatientData();
    const newPatientRecord = {
        linkedUsername: linkedUsername,
        patientId: 'P' + String(allPatientData.length + 1).padStart(3, '0'),
        nama: document.getElementById('nama').value,
        alamat: document.getElementById('alamat').value,
        no_telp: document.getElementById('no_telp').value,
        status_pasien: document.getElementById('status_pasien').value
    };

    allPatientData.push(newPatientRecord);
    savePatientData(allPatientData);
    const queueItem = addToQueue(newPatientRecord);
    alert(`Pendaftaran berhasil! ID Pasien: ${newPatientRecord.patientId}. Antrian: #${queueItem.queueNumber}.`);
    
    if(linkedUsername) handlePatientRoleView();
    else resetForm('newPatientForm');
    
    displayQueue();
}

function handleCreateUserSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.querySelector('#newUsername').value;
    const email = form.querySelector('#newEmail').value;
    const password = form.querySelector('#newPassword').value;
    const role = form.querySelector('#newRole').value;

    if(!username || !email || !password || !role) {
        alert('Semua field wajib diisi.');
        return;
    }

    const result = createUser(username, email, password, role);
    alert(result.message);

    if (result.success) {
        form.reset();
        displayUserList();
    }
}

// --- Tab Switching ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const tabButton = document.querySelector(`.tab-btn[onclick*="'${tab}'"]`);
    const tabContent = document.getElementById(`${tab}Tab`) || document.getElementById(`${tab.replace('-', '')}Tab`);

    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// --- User Management (Admin) ---
function displayUserList() {
    const userListContainer = document.getElementById('userList');
    if (!userListContainer) return;

    const users = getUsers();
    userListContainer.innerHTML = `
        <table class="stock-table">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}


// --- Patient Search (for Pasien Lama tab) ---
function searchPatient(query) {
    const resultsContainer = document.getElementById('searchResults');
    const allPatientData = getPatientData();
    if (!query) {
        resultsContainer.innerHTML = `<div class="empty-state"><p>Masukkan kata kunci untuk mencari pasien.</p></div>`;
        return;
    }
    const results = allPatientData.filter(p => p.nama.toLowerCase().includes(query.toLowerCase()));
    if (results.length === 0) {
        resultsContainer.innerHTML = `<div class="empty-state"><p>Pasien tidak ditemukan.</p></div>`;
        return;
    }
    resultsContainer.innerHTML = results.map(patient => `
        <div class="patient-card">
            <h4>${patient.nama} (ID: ${patient.patientId})</h4>
            <button class="btn-submit" onclick="selectPatient('${patient.patientId}')"><i class="fas fa-plus"></i> Tambah ke Antrian</button>
        </div>
    `).join('');
}

// --- Queue Management ---
function selectPatient(patientId) {
    const patient = getPatientData(patientId);
    if (patient) {
        addToQueue(patient);
        alert(`Pasien ${patient.nama} telah ditambahkan ke antrian.`);
        displayQueue();
    }
}

function addToQueue(patient) {
    const queue = getQueue();
    if (queue.some(item => item.patient.patientId === patient.patientId && item.status !== 'Selesai')) {
        alert('Pasien sudah ada di dalam antrian aktif.');
        return queue.find(item => item.patient.patientId === patient.patientId);
    }
    const queueNumber = queue.length > 0 ? Math.max(...queue.map(q => q.queueNumber)) + 1 : 1;
    const queueItem = {
        queueNumber,
        patient,
        status: 'Menunggu Pemeriksaan',
        registeredAt: new Date().toISOString()
    };
    queue.push(queueItem);
    saveQueue(queue);
    return queueItem;
}

function getStatusInfo(status) {
    const statusMap = {
        'Menunggu Pemeriksaan': { text: 'Menunggu Pemeriksaan', class: 'status-waiting' },
        'Menunggu Dokter': { text: 'Menunggu Dokter', class: 'status-examining' },
        'Menunggu Resep': { text: 'Menunggu Resep', class: 'status-pharmacy' },
        'Menunggu Pembayaran': { text: 'Menunggu Pembayaran', class: 'status-billing' },
        'Menunggu Pengambilan Obat': { text: 'Siap Diambil', class: 'status-pickup' },
        'Selesai': { text: 'Selesai', class: 'status-completed' },
    };
    return statusMap[status] || { text: status, class: 'status-unknown' };
}

function displayQueue() {
    const queueList = document.getElementById('queueList');
    const queue = getQueue().filter(item => item.status !== 'Selesai');
    const currentUser = getCurrentUser();
    
    if (queue.length === 0) {
        queueList.innerHTML = `<div class="empty-state"><p>Belum ada pasien dalam antrian aktif.</p></div>`;
        return;
    }

    queueList.innerHTML = queue.map(item => {
        const statusInfo = getStatusInfo(item.status);
        const adminButton = (currentUser && currentUser.role === 'admin') 
            ? `<button class="btn-action btn-sm" onclick="showPatientDetails('${item.patient.patientId}')"><i class="fas fa-eye"></i> Detail</button>`
            : '';

        return `
            <div class="queue-item">
                <div class="queue-number">#${item.queueNumber}</div>
                <div class="queue-info">
                    <div class="queue-name">${item.patient.nama}</div>
                    <div class="queue-details">ID: ${item.patient.patientId}</div>
                </div>
                <div class="queue-status ${statusInfo.class}">${statusInfo.text}</div>
                <div class="queue-actions">${adminButton}</div>
            </div>
        `;
    }).join('');
}

function showPatientDetails(patientId) {
    const modal = document.getElementById('patientDetailModal');
    const body = document.getElementById('patientDetailBody');
    const nameEl = document.getElementById('modalPatientName');

    const patientData = getPatientData(patientId);
    const queueItem = getQueue().find(item => item.patient.patientId === patientId);

    if (!patientData || !modal || !body || !nameEl) {
        console.error('Could not find patient data or modal elements.');
        return;
    }

    nameEl.textContent = `Detail Pasien: ${patientData.nama}`;
    body.innerHTML = `
        <div class="patient-detail-grid">
            <div><strong>ID Pasien:</strong></div><div>${patientData.patientId}</div>
            <div><strong>Nama:</strong></div><div>${patientData.nama}</div>
            <div><strong>Alamat:</strong></div><div>${patientData.alamat}</div>
            <div><strong>No. Telepon:</strong></div><div>${patientData.no_telp}</div>
            <div><strong>Status Keanggotaan:</strong></div><div>${patientData.status_pasien}</div>
            <hr>
            <div><strong>No. Antrian:</strong></div><div>#${queueItem ? queueItem.queueNumber : 'N/A'}</div>
            <div><strong>Status Saat Ini:</strong></div><div>${queueItem ? queueItem.status : 'N/A'}</div>
            <div><strong>Waktu Daftar:</strong></div><div>${queueItem ? new Date(queueItem.registeredAt).toLocaleString('id-ID') : 'N/A'}</div>
        </div>
    `;

    modal.style.display = 'block';
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



