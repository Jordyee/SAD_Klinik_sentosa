// Examination Module JavaScript

let patientVitals = {};
let medicalRecords = [];
let currentPrescriptionItems = []; // Holds items for the current prescription being built

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    if (!requireRole(['dokter', 'perawat', 'admin'])) {
        return;
    }
    
    const role = getCurrentRole();
    if (role === 'perawat') {
        document.getElementById('consultationTab').style.display = 'none';
        document.getElementById('historyTab').style.display = 'none';
        document.querySelectorAll('.tab-btn')[1].style.display = 'none';
        document.querySelectorAll('.tab-btn')[2].style.display = 'none';
    } else if (role === 'dokter') {
        document.getElementById('vitalsTab').style.display = 'none';
        document.querySelector('.tab-btn:first-child').style.display = 'none';
        switchExaminationTab('consultation');
        displayProblematicPrescriptions();
        populateMedicineSelect(); // For the prescription form
    }

    loadExaminationData();
    setupExaminationListeners();
});

function displayProblematicPrescriptions() {
    const container = document.getElementById('problematicPrescriptionsList');
    const section = document.getElementById('problematicPrescriptionsSection');
    const prescriptions = JSON.parse(localStorage.getItem('pendingPrescriptions') || '[]');
    const problematic = prescriptions.filter(p => p.status === 'pending_doctor_review');

    if (!container || !section) return;

    if (problematic.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = problematic.map(p => `
        <div class="prescription-card status-danger">
            <h4>Tinjauan Resep untuk ${p.patientName}</h4>
            <p><strong>Catatan dari Apotek:</strong> ${p.notes}</p>
            <div class="prescription-actions">
                <button class="btn-action btn-danger" onclick="cancelPrescription('${p.id}')">Batalkan Resep</button>
                <button class="btn-action btn-warning" onclick="editPrescription('${p.id}')">Ubah & Kirim Ulang</button>
            </div>
        </div>
    `).join('');
}

function cancelPrescription(prescriptionId) {
    Swal.fire({
        title: 'Anda yakin?',
        text: "Resep ini akan dibatalkan secara permanen.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, batalkan!',
        cancelButtonText: 'Tidak'
    }).then((result) => {
        if (result.isConfirmed) {
            let prescriptions = JSON.parse(localStorage.getItem('pendingPrescriptions') || '[]');
            const idx = prescriptions.findIndex(p => p.id === prescriptionId);
            if (idx > -1) {
                prescriptions[idx].status = 'cancelled';
                localStorage.setItem('pendingPrescriptions', JSON.stringify(prescriptions));
                Swal.fire('Dibatalkan!', 'Resep telah dibatalkan.', 'success');
                displayProblematicPrescriptions();
            }
        }
    });
}

async function editPrescription(prescriptionId) {
    let prescriptions = JSON.parse(localStorage.getItem('pendingPrescriptions') || '[]');
    const idx = prescriptions.findIndex(p => p.id === prescriptionId);
    if (idx > -1) {
        const { value: newNotes } = await Swal.fire({
            title: 'Ubah Resep',
            input: 'textarea',
            inputLabel: 'Catatan atau resep baru untuk apotek',
            inputValue: prescriptions[idx].notes,
            showCancelButton: true,
            confirmButtonText: 'Kirim Ulang',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) {
                    return 'Anda harus memasukkan catatan!';
                }
            }
        });

        if (newNotes) {
            prescriptions[idx].notes = `[DIUBAH DOKTER] ${newNotes}`;
            prescriptions[idx].status = 'pending'; // Resend to pharmacy
            localStorage.setItem('pendingPrescriptions', JSON.stringify(prescriptions));
            Swal.fire('Terkirim!', 'Resep telah diubah dan dikirim ulang ke apotek.', 'success');
            displayProblematicPrescriptions();
        }
    }
}

function loadExaminationData() {
    const savedVitals = localStorage.getItem('patientVitals');
    if (savedVitals) patientVitals = JSON.parse(savedVitals);

    const savedRecords = localStorage.getItem('medicalRecords');
    if (savedRecords) medicalRecords = JSON.parse(savedRecords);

    displayExaminationQueue();
    populatePatientSelects();
}

function setupExaminationListeners() {
    const vitalsForm = document.getElementById('vitalsForm');
    if (vitalsForm) vitalsForm.addEventListener('submit', handleVitalsSubmit);
    
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) consultationForm.addEventListener('submit', handleConsultationSubmit);
}

function switchExaminationTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    let tabIndex = 0;
    if (tab === 'consultation') tabIndex = 1;
    if (tab === 'history') tabIndex = 2;

    document.querySelectorAll('.tab-btn')[tabIndex].classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
}

function displayExaminationQueue() {
    const queueContainer = document.getElementById('examinationQueue');
    const examinationQueue = getQueue().filter(p => 
        ['Menunggu Pemeriksaan', 'Menunggu Dokter'].includes(p.status)
    );
    
    if (examinationQueue.length === 0) {
        queueContainer.innerHTML = `<div class="empty-state"><p>Belum ada pasien dalam antrian pemeriksaan.</p></div>`;
        return;
    }
    
    queueContainer.innerHTML = examinationQueue.map(item => {
        const statusInfo = getStatusInfo(item.status);
        return `
            <div class="queue-item">
                <div class="queue-number">#${item.queueNumber}</div>
                <div class="queue-info">
                    <div class="queue-name">${item.patient.nama}</div>
                    <div class="queue-details">ID: ${item.patient.patientId}</div>
                </div>
                <div class="queue-status ${statusInfo.class}">${statusInfo.text}</div>
            </div>
        `;
    }).join('');
}

function populatePatientSelects() {
    const queue = getQueue();
    const selects = ['patientSelect', 'consultationPatientSelect', 'historyPatientSelect'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        while (select.options.length > 1) select.remove(1);
        
        queue.forEach(item => {
            const option = document.createElement('option');
            option.value = item.patient.patientId;
            option.textContent = `${item.patient.nama} (#${item.queueNumber})`;
            select.appendChild(option);
        });
        select.value = currentValue;
    });
}

function handleVitalsSubmit(e) {
    e.preventDefault();
    const patientId = document.getElementById('patientSelect').value;
    if (!patientId) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu.', 'warning');
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
    localStorage.setItem('patientVitals', JSON.stringify(patientVitals));
    
    updateQueueStatus(patientId, 'Menunggu Dokter');
    
    Swal.fire('Berhasil', 'Data vital berhasil disimpan.', 'success');
    resetVitalsForm();
    refreshExaminationQueue();
}

function handleConsultationSubmit(e) {
    e.preventDefault();
    const patientId = document.getElementById('consultationPatientSelect').value;
    if (!patientId) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu.', 'warning');
        return;
    }
    
    const needsPrescription = document.getElementById('needsPrescription').checked;
    
    if (needsPrescription && currentPrescriptionItems.length === 0) {
        Swal.fire('Peringatan', 'Anda mencentang "memerlukan resep", tetapi belum ada obat yang ditambahkan ke resep.', 'warning');
        return;
    }

    const consultationData = {
        patientId: patientId,
        date: new Date().toISOString(),
        keluhan: document.getElementById('keluhan_pasien').value,
        hasil_pemeriksaan: document.getElementById('hasil_pemeriksaan').value,
        catatan_dokter: document.getElementById('catatan_dokter').value,
        needsPrescription: needsPrescription,
        prescriptionNotes: document.getElementById('prescription_notes').value || null,
        prescriptionItems: needsPrescription ? currentPrescriptionItems : []
    };
    
    medicalRecords.push(consultationData);
    localStorage.setItem('medicalRecords', JSON.stringify(medicalRecords));
    
    if (needsPrescription) {
        syncPrescriptionToPharmacy(patientId, {
            notes: consultationData.prescriptionNotes,
            items: consultationData.prescriptionItems
        });
    } else {
        updateQueueStatus(patientId, 'Menunggu Pembayaran');
    }
    
    Swal.fire('Berhasil', 'Hasil pemeriksaan berhasil disimpan!', 'success');
    resetConsultationForm();
    refreshExaminationQueue();
}

function loadPatientForConsultation(patientId) {
    const display = document.getElementById('patientHistoryDisplay');
    const keluhanTextarea = document.getElementById('keluhan_pasien');

    display.innerHTML = '';
    keluhanTextarea.value = '';

    if (!patientId) {
        display.innerHTML = `<div class="empty-state"><p>Pilih pasien untuk melihat data.</p></div>`;
        return;
    }

    const vitals = patientVitals[patientId];
    
    if (vitals) {
        display.innerHTML = `
            <h4><i class="fas fa-notes-medical"></i> Catatan dari Perawat</h4>
            <div class="vitals-display">
                <span><strong>Tinggi:</strong> ${vitals.tinggi_badan || '-'} cm</span>
                <span><strong>Berat:</strong> ${vitals.berat_badan || '-'} kg</span>
                <span><strong>Tensi:</strong> ${vitals.tensi_darah || '-'}</span>
                <span><strong>Suhu:</strong> ${vitals.suhu_badan || '-'} °C</span>
            </div>
            <p><strong>Keluhan Awal:</strong> ${vitals.keluhan_perawat || 'Tidak ada.'}</p>
        `;
        keluhanTextarea.value = vitals.keluhan_perawat || '';
    } else {
        display.innerHTML = `<div class="empty-state"><p>Data vital dari perawat belum diinput untuk pasien ini.</p></div>`;
    }
}

// --- Prescription Item Management ---

function populateMedicineSelect() {
    const select = document.getElementById('prescriptionMedicineSelect');
    if (!select) return;
    const medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
    medicines.forEach(med => {
        if (med.stok > 0) {
            const option = document.createElement('option');
            option.value = med.id;
            option.textContent = `${med.nama} (Stok: ${med.stok})`;
            option.dataset.name = med.nama;
            select.appendChild(option);
        }
    });
}

function addMedicineToPrescription() {
    const medicineSelect = document.getElementById('prescriptionMedicineSelect');
    const quantityInput = document.getElementById('prescriptionQuantity');
    
    const medicineId = medicineSelect.value;
    const quantity = parseInt(quantityInput.value);

    if (!medicineId || !quantity || quantity < 1) {
        Swal.fire('Peringatan', 'Pilih obat dan masukkan jumlah yang valid.', 'warning');
        return;
    }

    const selectedOption = medicineSelect.options[medicineSelect.selectedIndex];
    const medicineName = selectedOption.dataset.name;

    // Check if item already exists
    const existingItem = currentPrescriptionItems.find(item => item.medicineId === medicineId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        currentPrescriptionItems.push({
            id: 'item_' + Date.now(),
            medicineId: medicineId,
            medicineName: medicineName,
            quantity: quantity
        });
    }
    
    renderCurrentPrescription();
}

function removeMedicineFromPrescription(itemId) {
    currentPrescriptionItems = currentPrescriptionItems.filter(item => item.id !== itemId);
    renderCurrentPrescription();
}

function renderCurrentPrescription() {
    const container = document.getElementById('prescriptionItemsList');
    if (!container) return;

    if (currentPrescriptionItems.length === 0) {
        container.innerHTML = '<p class="empty-state-small">Belum ada obat yang ditambahkan.</p>';
        return;
    }

    container.innerHTML = `
        <table class="mini-table">
            <thead><tr><th>Obat</th><th>Jumlah</th><th>Aksi</th></tr></thead>
            <tbody>
                ${currentPrescriptionItems.map(item => `
                    <tr>
                        <td>${item.medicineName}</td>
                        <td>${item.quantity}</td>
                        <td><button type="button" class="btn-action-danger btn-sm" onclick="removeMedicineFromPrescription('${item.id}')"><i class="fas fa-times"></i></button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}


// --- Helper Functions ---

function resetVitalsForm() {
    document.getElementById('vitalsForm').reset();
}

function resetConsultationForm() {
    document.getElementById('consultationForm').reset();
    document.getElementById('needsPrescription').checked = false;
    currentPrescriptionItems = [];
    renderCurrentPrescription();
    togglePrescriptionForm();
}

function togglePrescriptionForm() {
    const checkbox = document.getElementById('needsPrescription');
    const form = document.getElementById('prescriptionForm');
    if(form) form.style.display = checkbox.checked ? 'block' : 'none';
    if (checkbox.checked) {
        renderCurrentPrescription(); // Initial render when shown
    }
}

function refreshExaminationQueue() {
    displayExaminationQueue();
    populatePatientSelects();
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


