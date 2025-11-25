// ======================================================================
// EXAMINATION MODULE - FIREBASE VERSION
// ======================================================================
// Medical records and prescriptions now saved to Firebase Firestore

let currentPrescriptionItems = []; // Holds items for the current prescription being built

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async function () {
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
        await displayProblematicPrescriptions();
        await populateMedicineSelect();
    }

    await loadExaminationData();
    setupExaminationListeners();
});

async function displayProblematicPrescriptions() {
    const container = document.getElementById('problematicPrescriptionsList');
    const section = document.getElementById('problematicPrescriptionsSection');

    if (!container || !section) return;

    const prescriptions = await getPrescriptions();
    const problematic = prescriptions.filter(p => p.status === 'pending_doctor_review');

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

async function cancelPrescription(prescriptionId) {
    const result = await Swal.fire({
        title: 'Anda yakin?',
        text: "Resep ini  akan dibatalkan secara permanen.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, batalkan!',
        cancelButtonText: 'Tidak'
    });

    if (result.isConfirmed) {
        await updatePrescriptionStatus(prescriptionId, 'cancelled');
        Swal.fire('Dibatalkan!', 'Resep telah dibatalkan.', 'success');
        await displayProblematicPrescriptions();
    }
}

async function editPrescription(prescriptionId) {
    const prescriptions = await getPrescriptions();
    const prescription = prescriptions.find(p => p.id === prescriptionId);

    if (!prescription) return;

    const { value: newNotes } = await Swal.fire({
        title: 'Ubah Resep',
        input: 'textarea',
        inputLabel: 'Catatan atau resep baru untuk apotek',
        inputValue: prescription.notes,
        showCancelButton: true,
        confirmButtonText: 'Kirim Ulang',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value) return 'Anda harus memasukkan catatan!';
        }
    });

    if (newNotes) {
        await firebaseDB.collection('prescriptions').doc(prescriptionId).update({
            notes: `[DIUBAH DOKTER] ${newNotes}`,
            status: 'pending',
            updatedAt: new Date()
        });

        Swal.fire('Terkirim!', 'Resep telah diubah dan dikirim ulang ke apotek.', 'success');
        await displayProblematicPrescriptions();
    }
}

async function loadExaminationData() {
    await displayExaminationQueue();
    await populatePatientSelects();
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

async function displayExaminationQueue() {
    const queueContainer = document.getElementById('examinationQueue');
    const queue = await getQueue();
    const examinationQueue = queue.filter(p =>
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
                    <div class="queue-name">${item.patientName}</div>
                    <div class="queue-details">ID: ${item.patientId}</div>
                </div>
                <div class="queue-status ${statusInfo.class}">${statusInfo.text}</div>
            </div>
        `;
    }).join('');
}

async function populatePatientSelects() {
    const queue = await getQueue();
    const selects = ['patientSelect', 'consultationPatientSelect', 'historyPatientSelect'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Clear existing options except first
        while (select.options.length > 1) select.remove(1);

        queue.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id; // Use appointment ID
            option.dataset.patientId = item.patientId;
            option.textContent = `${item.patientName} (#${item.queueNumber})`;
            select.appendChild(option);
        });
    });
}

/**
 * Handle Vitals Submit (Save to Firebase)
 */
async function handleVitalsSubmit(e) {
    e.preventDefault();
    const appointmentId = document.getElementById('patientSelect').value;
    if (!appointmentId) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu.', 'warning');
        return;
    }

    const select = document.getElementById('patientSelect');
    const patientId = select.options[select.selectedIndex].dataset.patientId;

    const vitalsData = {
        appointmentId: appointmentId,
        patientId: patientId,
        tinggi_badan: document.getElementById('tinggi_badan').value,
        berat_badan: document.getElementById('berat_badan').value,
        tensi_darah: document.getElementById('tensi_darah').value,
        suhu_badan: document.getElementById('suhu_badan').value || null,
        keluhan_perawat: document.getElementById('keluhan_perawat').value,
        date: new Date(),
        createdBy: getCurrentUser().username
    };

    // Save to Firebase medicalRecords collection
    await firebaseDB.collection('medicalRecords').add(vitalsData);

    // Update appointment status
    await updateQueueStatus(appointmentId, 'Menunggu Dokter');

    Swal.fire('Berhasil', 'Data vital berhasil disimpan.', 'success');
    resetVitalsForm();
    await refreshExaminationQueue();
}

/**
 * Handle Consultation Submit (Save Medical Record & Prescription to Firebase)
 */
async function handleConsultationSubmit(e) {
    e.preventDefault();
    const appointmentId = document.getElementById('consultationPatientSelect').value;
    if (!appointmentId) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu.', 'warning');
        return;
    }

    const select = document.getElementById('consultationPatientSelect');
    const patientId = select.options[select.selectedIndex].dataset.patientId;

    const needsPrescription = document.getElementById('needsPrescription').checked;

    if (needsPrescription && currentPrescriptionItems.length === 0) {
        Swal.fire('Peringatan', 'Anda mencentang "memerlukan resep", tetapi belum ada obat yang ditambahkan ke resep.', 'warning');
        return;
    }

    const consultationData = {
        appointmentId: appointmentId,
        patientId: patientId,
        type: 'consultation',
        keluhan: document.getElementById('keluhan_pasien').value,
        diagnosis: document.getElementById('hasil_pemeriksaan').value,
        treatment: document.getElementById('catatan_dokter').value,
        needsPrescription: needsPrescription,
        date: new Date(),
        createdBy: getCurrentUser().username
    };

    // Save medical record to Firebase
    await firebaseDB.collection('medicalRecords').add(consultationData);

    // Update appointment with diagnosis & treatment
    await firebaseDB.collection('appointments').doc(appointmentId).update({
        diagnosis: consultationData.diagnosis,
        treatment: consultationData.treatment,
        updatedAt: new Date()
    });

    if (needsPrescription) {
        // Save prescription with items
        const prescriptionData = {
            appointmentId: appointmentId,
            patientId: patientId,
            patientName: select.options[select.selectedIndex].textContent.split(' (#')[0],
            doctorName: getCurrentUser().fullName || getCurrentUser().username,
            diagnosis: consultationData.diagnosis,
            notes: document.getElementById('prescription_notes').value || '',
            status: 'pending',
            paymentStatus: 'unpaid',
            items: currentPrescriptionItems
        };

        await savePrescription(prescriptionData);

        // Update appointment status to waiting for pharmacy
        await updateQueueStatus(appointmentId, 'Menunggu Resep');
    } else {
        // No prescription, go to billing
        await updateQueueStatus(appointmentId, 'Menunggu Pembayaran');
    }

    Swal.fire('Berhasil', 'Hasil pemeriksaan berhasil disimpan!', 'success');
    resetConsultationForm();
    await refreshExaminationQueue();
}

/**
 * Load Patient Vitals for Consultation View
 */
async function loadPatientForConsultation(appointmentId) {
    const display = document.getElementById('patientHistoryDisplay');
    const keluhanTextarea = document.getElementById('keluhan_pasien');

    display.innerHTML = '';
    keluhanTextarea.value = '';

    if (!appointmentId) {
        display.innerHTML = `<div class="empty-state"><p>Pilih pasien untuk melihat data.</p></div>`;
        return;
    }

    const select = document.getElementById('consultationPatientSelect');
    const patientId = select.options[select.selectedIndex].dataset.patientId;

    // Get latest vitals for this patient
    const vitalsSnapshot = await firebaseDB.collection('medicalRecords')
        .where('patientId', '==', patientId)
        .where('type', '==', undefined) // Vitals don't have type field
        .orderBy('date', 'desc')
        .limit(1)
        .get();

    if (!vitalsSnapshot.empty) {
        const vitals = vitalsSnapshot.docs[0].data();
        display.innerHTML = `
            <h4><i class="fas fa-notes-medical"></i> Catatan dari Perawat</h4>
            <div class="vitals-display">
                <span><strong>Tinggi:</strong> ${vitals.tinggi_badan || '-'} cm</span>
                <span><strong>Berat:</strong> ${vitals.berat_badan || '-'} kg</span>
                <span><strong>Tensi:</strong> ${vitals.tensi_darah || '-'}</span>
                <span><strong>Suhu:</strong> ${vitals.suhu_badan || '-'} °C</span>
            </div>
            <p><strong>Keluhan Awal:</strong> ${vitals.keluhan_perawat || 'Tidak ada.'}</p>
            <p class="vitals-timestamp"><em>Catatan perawat terakhir: ${vitals.date.toDate().toLocaleString('id-ID')}</em></p>
        `;
        keluhanTextarea.value = vitals.keluhan_perawat || '';
    } else {
        display.innerHTML = `<div class="empty-state"><p>Data vital dari perawat belum diinput untuk pasien ini.</p></div>`;
    }
}

/**
 * Load Patient Medical History from Firebase
 */
async function loadPatientHistory(appointmentId) {
    const container = document.getElementById('patientHistoryList');

    if (!appointmentId) {
        container.innerHTML = `<div class="empty-state"><p>Pilih pasien untuk melihat riwayat medis.</p></div>`;
        return;
    }

    const select = document.getElementById('historyPatientSelect');
    const patientId = select.options[select.selectedIndex].dataset.patientId;

    // Get all medical records for this patient
    const recordsSnapshot = await firebaseDB.collection('medicalRecords')
        .where('patientId', '==', patientId)
        .orderBy('date', 'desc')
        .get();

    if (recordsSnapshot.empty) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada riwayat untuk pasien ini.</p></div>`;
        return;
    }

    let html = '<h4>Riwayat Medis</h4>';

    recordsSnapshot.forEach(doc => {
        const record = doc.data();
        const date = record.date.toDate();

        if (record.type === 'consultation') {
            // Consultation record
            html += `
                <div class="history-card">
                    <p><strong>Tanggal:</strong> ${date.toLocaleString('id-ID')}</p>
                    <p><strong>Keluhan:</strong> ${record.keluhan}</p>
                    <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
                    <p><strong>Treatment:</strong> ${record.treatment || '-'}</p>
                </div>
            `;
        } else {
            // Vitals record
            html += `
                <div class="history-card">
                    <p><strong>Waktu:</strong> ${date.toLocaleString('id-ID')}</p>
                    <p><strong>Tinggi / Berat:</strong> ${record.tinggi_badan || '-'} cm / ${record.berat_badan || '-'} kg</p>
                    <p><strong>Tensi:</strong> ${record.tensi_darah || '-'}</p>
                    <p><strong>Suhu:</strong> ${record.suhu_badan || '-'}</p>
                    <p><strong>Keluhan Perawat:</strong> ${record.keluhan_perawat || '-'}</p>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

// --- Prescription Item Management ---

async function populateMedicineSelect() {
    const select = document.getElementById('prescriptionMedicineSelect');
    if (!select) return;

    const medicines = await getMedicines();
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

function togglePres criptionForm() {
    const checkbox = document.getElementById('needsPrescription');
    const form = document.getElementById('prescriptionForm');
    if (form) form.style.display = checkbox.checked ? 'block' : 'none';
    if (checkbox.checked) {
        renderCurrentPrescription();
    }
}

async function refreshExaminationQueue() {
    await displayExaminationQueue();
    await populatePatientSelects();
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

console.log('✅ Examination.js (Firebase) loaded successfully!');
