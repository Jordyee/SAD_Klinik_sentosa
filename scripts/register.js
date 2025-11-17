// Registration Module JavaScript

// Data pasien & antrian
// Disimpan ke localStorage supaya TIDAK hilang saat kembali ke halaman
let patients = [];
let queue = [];

// Keys untuk localStorage
const PATIENTS_KEY = 'patients';
const QUEUE_KEY = 'patientQueue';

// Load data awal dari localStorage atau buat sample awal
function loadInitialData() {
    try {
        const savedPatients = localStorage.getItem(PATIENTS_KEY);
        const savedQueue = localStorage.getItem(QUEUE_KEY);

        if (savedPatients) {
            patients = JSON.parse(savedPatients);
        } else {
            // Sample patient data (hanya pertama kali)
            patients = [
                {
                    id: 'P001',
                    nama: 'Ahmad Wijaya',
                    alamat: 'Jl. Sudirman No. 123, Jakarta',
                    no_telp: '081234567890',
                    lastVisit: '2024-10-15'
                },
                {
                    id: 'P002',
                    nama: 'Siti Nurhaliza',
                    alamat: 'Jl. Gatot Subroto No. 456, Jakarta',
                    no_telp: '081987654321',
                    lastVisit: '2024-11-01'
                }
            ];
            localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
        }

        if (savedQueue) {
            queue = JSON.parse(savedQueue);
        } else {
            queue = [];
        }
    } catch (e) {
        console.error('Gagal memuat data pendaftaran dari localStorage:', e);
    }
}

// Simpan perubahan ke localStorage
function persistPatients() {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

function persistQueue() {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Tab switching
function switchTab(tab) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab
    if (tab === 'new') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('newPatientTab').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('existingPatientTab').classList.add('active');
    }
}

// New Patient Form Submission
document.addEventListener('DOMContentLoaded', function() {
    // Muat data dari localStorage terlebih dahulu
    loadInitialData();

    const newPatientForm = document.getElementById('newPatientForm');
    if (newPatientForm) {
        newPatientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                nama: document.getElementById('nama').value,
                alamat: document.getElementById('alamat').value,
                no_telp: document.getElementById('no_telp').value,
                status_pasien: document.getElementById('status_pasien').value
            };
            
            // Generate patient ID (berdasarkan jumlah data tersimpan)
            const patientId = 'P' + String(patients.length + 1).padStart(3, '0');
            
            // Add to patients array
            const newPatient = {
                id: patientId,
                ...formData,
                lastVisit: new Date().toISOString().split('T')[0]
            };
            
            patients.push(newPatient);
            persistPatients();
            
            // Add to queue
            const queueItem = addToQueue(newPatient);
            
            // Reset form
            resetForm();
            
            // Tampilkan pesan yang lebih jelas di halaman
            const info = document.getElementById('registrationInfo');
            if (info) {
                info.innerHTML = `
                    <div class="info-success">
                        <strong>Pendaftaran berhasil!</strong><br>
                        ID Pasien: <strong>${patientId}</strong><br>
                        Nama: <strong>${formData.nama}</strong><br>
                        Nomor Antrian Anda: <strong>#${queueItem.queueNumber}</strong><br>
                        Silakan menunggu, status antrian dapat dilihat di bagian <em>Daftar Antrian</em> di bawah.
                    </div>
                `;
            } else {
                // Fallback jika elemen info belum ada
                alert(`Pasien berhasil didaftarkan!\nID Pasien: ${patientId}\nNama: ${formData.nama}\n\nSilakan melihat nomor antrian Anda di daftar antrian di bawah.`);
            }
            
            // Refresh queue display
            displayQueue();
        });
    }
    
    // Initial queue display
    displayQueue();
});

// Search Patient
function searchPatient(query) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query || query.trim() === '') {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Masukkan kata kunci untuk mencari pasien</p>
            </div>
        `;
        return;
    }
    
    const searchTerm = query.toLowerCase();
    const results = patients.filter(patient => 
        patient.nama.toLowerCase().includes(searchTerm) ||
        patient.no_telp.includes(searchTerm) ||
        patient.id.toLowerCase().includes(searchTerm)
    );
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-times"></i>
                <p>Pasien tidak ditemukan</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.map(patient => `
        <div class="patient-card">
            <div class="patient-card-header">
                <div>
                    <div class="patient-name">${patient.nama}</div>
                    <div class="patient-id">ID: ${patient.id}</div>
                </div>
            </div>
            <div class="patient-info">
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>${patient.no_telp}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${patient.alamat}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>Kunjungan Terakhir: ${patient.lastVisit}</span>
                </div>
            </div>
            <div class="patient-actions">
                <button class="btn-action btn-edit" onclick="editPatient('${patient.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-select" onclick="selectPatient('${patient.id}')">
                    <i class="fas fa-check"></i> Pilih
                </button>
            </div>
        </div>
    `).join('');
}

// Select Patient
function selectPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        addToQueue(patient);
        persistQueue();
        displayQueue();
        alert(`Pasien ${patient.nama} telah ditambahkan ke antrian`);
    }
}

// Edit Patient
function editPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        // Switch to new patient tab and fill form
        switchTab('new');
        document.getElementById('nama').value = patient.nama;
        document.getElementById('alamat').value = patient.alamat;
        document.getElementById('no_telp').value = patient.no_telp;
        
        // Scroll to form
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }
}

// Add to Queue
function addToQueue(patient) {
    const queueNumber = queue.length + 1;
    const queueItem = {
        queueNumber: queueNumber,
        patient: patient,
        status: 'waiting',
        registeredAt: new Date().toISOString()
    };
    
    queue.push(queueItem);
    persistQueue();
    return queueItem;
}

// Display Queue
function displayQueue() {
    const queueList = document.getElementById('queueList');
    
    if (queue.length === 0) {
        queueList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <p>Belum ada pasien dalam antrian</p>
            </div>
        `;
        return;
    }
    
    queueList.innerHTML = queue.map(item => `
        <div class="queue-item">
            <div class="queue-number">#${item.queueNumber}</div>
            <div class="queue-info">
                <div class="queue-name">${item.patient.nama}</div>
                <div class="queue-details">
                    ID: ${item.patient.id} | Telp: ${item.patient.no_telp}
                </div>
            </div>
            <div class="queue-status status-${item.status}">
                ${getStatusText(item.status)}
            </div>
        </div>
    `).join('');
}

// Get Status Text
function getStatusText(status) {
    const statusMap = {
        'waiting': 'Menunggu',
        'examining': 'Diperiksa',
        'completed': 'Selesai'
    };
    return statusMap[status] || status;
}

// Reset Form
function resetForm() {
    const form = document.getElementById('newPatientForm');
    if (form) {
        form.reset();
    }
}

// Refresh Queue
function refreshQueue() {
    displayQueue();
}


