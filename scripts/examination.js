// Examination Module JavaScript

let examinationQueue = [];
let patientVitals = {};
let medicalRecords = [];

// Key untuk sinkronisasi status antrian antar modul
const QUEUE_STORAGE_KEY = 'patientQueue';

// Tab switching
function switchExaminationTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'vitals') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('vitalsTab').classList.add('active');
    } else if (tab === 'consultation') {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('consultationTab').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('historyTab').classList.add('active');
    }
}

// Load examination queue from registration queue
function loadExaminationQueue() {
    // In real app, this would fetch from API
    // For now, simulate from localStorage or use sample data
    const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (savedQueue) {
        examinationQueue = JSON.parse(savedQueue);
    } else {
        // Sample data
        examinationQueue = [
            { queueNumber: 1, patient: { id: 'P001', nama: 'Ahmad Wijaya', no_telp: '081234567890' }, status: 'waiting' },
            { queueNumber: 2, patient: { id: 'P002', nama: 'Siti Nurhaliza', no_telp: '081987654321' }, status: 'waiting' }
        ];
    }
    
    displayExaminationQueue();
    populatePatientSelects();
}

// Display examination queue
function displayExaminationQueue() {
    const queueContainer = document.getElementById('examinationQueue');
    
    if (examinationQueue.length === 0) {
        queueContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <p>Belum ada pasien dalam antrian pemeriksaan</p>
            </div>
        `;
        return;
    }
    
    queueContainer.innerHTML = examinationQueue.map(item => `
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

// Populate patient select dropdowns
function populatePatientSelects() {
    const selects = ['patientSelect', 'consultationPatientSelect', 'historyPatientSelect'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            examinationQueue.forEach(item => {
                const option = document.createElement('option');
                option.value = item.patient.id;
                option.textContent = `${item.patient.nama} (${item.patient.id})`;
                select.appendChild(option);
            });
        }
    });
}

// Load patient data for vitals
function loadPatientData(patientId) {
    // In real app, fetch from API
    const patient = examinationQueue.find(item => item.patient.id === patientId);
    if (patient) {
        // Load existing vitals if any
        const existingVitals = patientVitals[patientId];
        if (existingVitals) {
            document.getElementById('tinggi_badan').value = existingVitals.tinggi_badan || '';
            document.getElementById('berat_badan').value = existingVitals.berat_badan || '';
            document.getElementById('tensi_darah').value = existingVitals.tensi_darah || '';
            document.getElementById('suhu_badan').value = existingVitals.suhu_badan || '';
        }
    }
}

// Load patient for consultation
function loadPatientForConsultation(patientId) {
    const patient = examinationQueue.find(item => item.patient.id === patientId);
    if (patient) {
        // Load vitals & keluhan dari perawat
        const vitals = patientVitals[patientId];
        if (vitals) {
            document.getElementById('patientHistoryDisplay').innerHTML = `
                <div class="history-card">
                    <h4>Ringkasan Data dari Perawat</h4>
                    <div class="vitals-display">
                        <div class="vital-item">
                            <span class="vital-label">Tinggi Badan:</span>
                            <span class="vital-value">${vitals.tinggi_badan} cm</span>
                        </div>
                        <div class="vital-item">
                            <span class="vital-label">Berat Badan:</span>
                            <span class="vital-value">${vitals.berat_badan} kg</span>
                        </div>
                        <div class="vital-item">
                            <span class="vital-label">Tensi Darah:</span>
                            <span class="vital-value">${vitals.tensi_darah}</span>
                        </div>
                        ${vitals.suhu_badan ? `
                        <div class="vital-item">
                            <span class="vital-label">Suhu Badan:</span>
                            <span class="vital-value">${vitals.suhu_badan} °C</span>
                        </div>
                        ` : ''}
                    </div>
                    ${vitals.keluhan_perawat ? `
                    <div class="history-section">
                        <strong>Keluhan Utama (dari perawat):</strong>
                        <p>${vitals.keluhan_perawat}</p>
                    </div>
                    ` : ''}
                </div>
            `;

            // Prefill textarea keluhan dokter dengan keluhan dari perawat (boleh disesuaikan)
            const keluhanField = document.getElementById('keluhan_pasien');
            if (keluhanField && !keluhanField.value) {
                keluhanField.value = vitals.keluhan_perawat || '';
            }
        } else {
            document.getElementById('patientHistoryDisplay').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heartbeat"></i>
                    <p>Data vital dan keluhan dari perawat belum diinput untuk pasien ini.</p>
                </div>
            `;
        }
        
        // Load previous medical records
        loadPatientHistory(patientId);
    }
}

// Load patient history
function loadPatientHistory(patientId) {
    const historyContainer = document.getElementById('patientHistoryList');
    const patientRecords = medicalRecords.filter(record => record.patientId === patientId);
    
    if (patientRecords.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <p>Belum ada riwayat medis untuk pasien ini</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = patientRecords.map(record => `
        <div class="history-card">
            <div class="history-header">
                <h4>Kunjungan ${new Date(record.date).toLocaleDateString('id-ID')}</h4>
                <span class="history-status">${record.status}</span>
            </div>
            <div class="history-content">
                <div class="history-section">
                    <strong>Keluhan:</strong>
                    <p>${record.keluhan || '-'}</p>
                </div>
                <div class="history-section">
                    <strong>Hasil Pemeriksaan:</strong>
                    <p>${record.hasil_pemeriksaan || '-'}</p>
                </div>
                <div class="history-section">
                    <strong>Catatan Dokter:</strong>
                    <p>${record.catatan_dokter || '-'}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle prescription form
function togglePrescriptionForm() {
    const checkbox = document.getElementById('needsPrescription');
    const form = document.getElementById('prescriptionForm');
    form.style.display = checkbox.checked ? 'block' : 'none';
}

// Reset vitals form
function resetVitalsForm() {
    document.getElementById('vitalsForm').reset();
    document.getElementById('patientSelect').value = '';
}

// Reset consultation form
function resetConsultationForm() {
    document.getElementById('consultationForm').reset();
    document.getElementById('consultationPatientSelect').value = '';
    document.getElementById('patientHistoryDisplay').innerHTML = '';
    document.getElementById('needsPrescription').checked = false;
    togglePrescriptionForm();
}

// Refresh examination queue
function refreshExaminationQueue() {
    loadExaminationQueue();
}

// Get status text (tahapan pasien)
function getStatusText(status) {
    const statusMap = {
        'waiting': 'Menunggu pemeriksaan (belum diperiksa perawat)',
        'examining': 'Sudah diperiksa perawat / menunggu dokter',
        'completed': 'Selesai diperiksa dokter'
    };
    return statusMap[status] || status;
}

// Update status antrian dan simpan ke localStorage
function updateQueueStatus(patientId, newStatus) {
    let changed = false;

    examinationQueue.forEach(item => {
        if (item.patient.id === patientId) {
            item.status = newStatus;
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(examinationQueue));
    }

    return changed;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadExaminationQueue();
    
    // Vitals form submission
    const vitalsForm = document.getElementById('vitalsForm');
    if (vitalsForm) {
        vitalsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patientId = document.getElementById('patientSelect').value;
            if (!patientId) {
                alert('Pilih pasien terlebih dahulu');
                return;
            }
            
            const vitalsData = {
                tinggi_badan: document.getElementById('tinggi_badan').value,
                berat_badan: document.getElementById('berat_badan').value,
                tensi_darah: document.getElementById('tensi_darah').value,
                suhu_badan: document.getElementById('suhu_badan').value || null,
                keluhan_perawat: document.getElementById('keluhan_perawat').value
            };
            
            patientVitals[patientId] = vitalsData;

            // Simpan vitals ke localStorage
            localStorage.setItem('patientVitals', JSON.stringify(patientVitals));
            
            // Update queue status: sudah diperiksa perawat / menunggu dokter
            updateQueueStatus(patientId, 'examining');
            
            alert('Data vital & keluhan utama berhasil disimpan!');
            resetVitalsForm();
            displayExaminationQueue();
        });
    }
    
    // Consultation form submission
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        consultationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patientId = document.getElementById('consultationPatientSelect').value;
            if (!patientId) {
                alert('Pilih pasien terlebih dahulu');
                return;
            }
            
            const consultationData = {
                patientId: patientId,
                date: new Date().toISOString(),
                keluhan: document.getElementById('keluhan_pasien').value,
                hasil_pemeriksaan: document.getElementById('hasil_pemeriksaan').value,
                catatan_dokter: document.getElementById('catatan_dokter').value,
                needsPrescription: document.getElementById('needsPrescription').checked,
                prescriptionNotes: document.getElementById('prescription_notes').value || null,
                status: 'completed'
            };
            
            medicalRecords.push(consultationData);

            // Jika perlu resep, kirim ke modul apotek melalui pendingPrescriptions
            if (consultationData.needsPrescription && typeof syncPrescriptionToPharmacy === 'function') {
                syncPrescriptionToPharmacy(patientId, {
                    notes: consultationData.prescriptionNotes,
                    items: [] // Untuk saat ini hanya catatan, tanpa detail struktur obat per item
                });
            }
            
            // Update queue status: selesai diperiksa dokter
            updateQueueStatus(patientId, 'completed');
            
            // Save to localStorage
            localStorage.setItem('medicalRecords', JSON.stringify(medicalRecords));
            localStorage.setItem('patientVitals', JSON.stringify(patientVitals));
            
            alert('Hasil pemeriksaan berhasil disimpan!');
            resetConsultationForm();
            displayExaminationQueue();
        });
    }
    
    // Load saved data
    const savedRecords = localStorage.getItem('medicalRecords');
    if (savedRecords) {
        medicalRecords = JSON.parse(savedRecords);
    }
    
    const savedVitals = localStorage.getItem('patientVitals');
    if (savedVitals) {
        patientVitals = JSON.parse(savedVitals);
    }
});


