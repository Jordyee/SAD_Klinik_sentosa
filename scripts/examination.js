// Examination Module JavaScript (API Integration)

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function () {
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
        // displayProblematicPrescriptions(); // Not implemented in backend yet
        populateMedicineSelect();
    }

    loadExaminationData();
    setupExaminationListeners();
});

function loadExaminationData() {
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

// --- Queue Management ---

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

async function displayExaminationQueue() {
    const queueContainer = document.getElementById('examinationQueue');
    const queue = await getQueue();

    // Filter for patients waiting for examination or doctor
    const examinationQueue = queue.filter(p =>
        ['Waiting', 'Examining'].includes(p.status)
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

function getStatusInfo(status) {
    const statusMap = {
        'Waiting': { text: 'Menunggu Pemeriksaan', class: 'status-waiting' },
        'Examining': { text: 'Menunggu Dokter', class: 'status-examining' },
        'Pharmacy': { text: 'Menunggu Resep', class: 'status-pharmacy' },
        'Cashier': { text: 'Menunggu Pembayaran', class: 'status-billing' },
        'Done': { text: 'Selesai', class: 'status-completed' },
    };
    return statusMap[status] || { text: status, class: 'status-unknown' };
}

async function populatePatientSelects() {
    const queue = await getQueue();
    const selects = ['patientSelect', 'consultationPatientSelect', 'historyPatientSelect'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        // preserve existing options except default
        while (select.options.length > 1) select.remove(1);

        // Create or ensure a search input exists directly above the select for quicker filtering
        let searchInput = document.getElementById(selectId + '_search');
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'search';
            searchInput.id = selectId + '_search';
            searchInput.placeholder = 'Cari nama atau ID...';
            searchInput.className = 'searchable-select-input';
            select.parentNode.insertBefore(searchInput, select);

            // Debounced filter handler
            let timeout;
            searchInput.addEventListener('input', function (e) {
                clearTimeout(timeout);
                const q = e.target.value.trim().toLowerCase();
                timeout = setTimeout(() => {
                    for (let i = 1; i < select.options.length; i++) {
                        const opt = select.options[i];
                        const txt = opt.textContent.toLowerCase();
                        opt.hidden = q !== '' && !txt.includes(q);
                    }
                }, 180);
            });
        }

        // Populate options
        // Filter based on role?
        // Nurse sees 'Waiting'
        // Doctor sees 'Examining' (which is 'Menunggu Dokter')
        // But for history, maybe all?
        // For now, show all active queue items to be safe, or filter.

        queue.forEach(item => {
            const option = document.createElement('option');
            option.value = item.patientId;
            option.textContent = `${item.patientName} (#${item.queueNumber})`;
            option.dataset.visitId = item.id; // Store visitId
            select.appendChild(option);
        });

        // Reset any active filter
        if (searchInput) {
            searchInput.value = '';
        }

        select.value = currentValue;
    });
}

// --- Vitals Submission (Nurse) ---

async function handleVitalsSubmit(e) {
    e.preventDefault();
    const patientSelect = document.getElementById('patientSelect');
    const patientId = patientSelect.value;
    const visitId = patientSelect.options[patientSelect.selectedIndex].dataset.visitId;

    if (!patientId || !visitId) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu.', 'warning');
        return;
    }

    const vitalsData = {
        height: document.getElementById('tinggi_badan').value,
        weight: document.getElementById('berat_badan').value,
        bloodPressure: document.getElementById('tensi_darah').value,
        temperature: document.getElementById('suhu_badan').value || null,
        nurseNotes: document.getElementById('keluhan_perawat').value // Add this to vitals object
    };

    try {
        const response = await fetch(`${API_BASE_URL}/medical-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitId,
                patientId,
                vitals: vitalsData
                // No diagnosis, so backend will set status to 'Examining'
            })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire('Berhasil', 'Data vital berhasil disimpan.', 'success');
            document.getElementById('vitalsForm').reset();
            loadExaminationData();
        } else {
            Swal.fire('Gagal', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Terjadi kesalahan koneksi.', 'error');
    }
}

// --- Consultation Submission (Doctor) ---

let currentPrescriptionItems = [];

async function handleConsultationSubmit(e) {
    e.preventDefault();
    const patientSelect = document.getElementById('consultationPatientSelect');
    const patientId = patientSelect.value;
    const visitId = patientSelect.options[patientSelect.selectedIndex].dataset.visitId;

    if (!patientId || !visitId) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu.', 'warning');
        return;
    }

    const needsPrescription = document.getElementById('needsPrescription').checked;

    if (needsPrescription && currentPrescriptionItems.length === 0) {
        Swal.fire('Peringatan', 'Anda mencentang "memerlukan resep", tetapi belum ada obat yang ditambahkan ke resep.', 'warning');
        return;
    }

    const consultationData = {
        visitId,
        patientId,
        doctorId: getCurrentUser().id, // Assuming user has ID
        diagnosis: document.getElementById('hasil_pemeriksaan').value,
        notes: document.getElementById('catatan_dokter').value,
        prescription: needsPrescription ? currentPrescriptionItems : []
    };

    try {
        const response = await fetch(`${API_BASE_URL}/medical-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(consultationData)
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire('Berhasil', 'Hasil pemeriksaan berhasil disimpan!', 'success');
            resetConsultationForm();
            loadExaminationData();
        } else {
            Swal.fire('Gagal', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Terjadi kesalahan koneksi.', 'error');
    }
}

async function loadPatientForConsultation(patientId) {
    const display = document.getElementById('patientHistoryDisplay');
    const keluhanTextarea = document.getElementById('keluhan_pasien'); // Note: This field might not exist in backend vitals yet

    display.innerHTML = '';
    keluhanTextarea.value = '';

    if (!patientId) {
        display.innerHTML = `<div class="empty-state"><p>Pilih pasien untuk melihat data.</p></div>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/medical-records/patient/${patientId}`);
        const records = await response.json();

        // Find the latest record with vitals (likely the one just created by Nurse)
        // We can filter by date or just take the last one that has vitals.
        const latestVitalsRecord = records.filter(r => r.vitals).sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (latestVitalsRecord && latestVitalsRecord.vitals) {
            const v = latestVitalsRecord.vitals;
            display.innerHTML = `
                <h4><i class="fas fa-notes-medical"></i> Catatan dari Perawat</h4>
                <div class="vitals-display">
                    <span><strong>Tinggi:</strong> ${v.height || '-'} cm</span>
                    <span><strong>Berat:</strong> ${v.weight || '-'} kg</span>
                    <span><strong>Tensi:</strong> ${v.bloodPressure || '-'}</span>
                    <span><strong>Suhu:</strong> ${v.temperature || '-'} °C</span>
                </div>
                <p><strong>Keluhan Awal:</strong> ${v.nurseNotes || 'Tidak ada.'}</p>
                <p class="vitals-timestamp"><em>Catatan perawat terakhir: ${new Date(latestVitalsRecord.date).toLocaleString('id-ID')}</em></p>
            `;
            keluhanTextarea.value = v.nurseNotes || ''; // Pre-fill complaint if available
        } else {
            display.innerHTML = `<div class="empty-state"><p>Data vital dari perawat belum diinput untuk pasien ini.</p></div>`;
        }
    } catch (error) {
        console.error('Error fetching patient history:', error);
    }
}

// --- History ---

async function loadPatientHistory(patientId) {
    const container = document.getElementById('patientHistoryList');
    if (!patientId) {
        container.innerHTML = `<div class="empty-state"><p>Pilih pasien untuk melihat riwayat medis.</p></div>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/medical-records/patient/${patientId}`);
        const records = await response.json();

        if (records.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>Tidak ada riwayat untuk pasien ini.</p></div>`;
            return;
        }

        // Sort by date desc
        records.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = `<h4>Riwayat Medis</h4>`;
        html += records.map(r => `
            <div class="history-card">
                <p><strong>Tanggal:</strong> ${new Date(r.date).toLocaleString('id-ID')}</p>
                ${r.vitals ? `
                <div class="vitals-mini">
                    <small>Vital: ${r.vitals.bloodPressure || '-'} mmHg, ${r.vitals.temperature || '-'}°C</small>
                </div>` : ''}
                <p><strong>Diagnosis:</strong> ${r.diagnosis || '-'}</p>
                <p><strong>Catatan:</strong> ${r.notes || '-'}</p>
                ${r.prescription && r.prescription.length ? `<p><strong>Resep:</strong> ${r.prescription.map(i => i.medicineName + ' x' + i.quantity).join(', ')}</p>` : ''}
            </div>
        `).join('');

        container.innerHTML = html;
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

// --- Prescription Item Management ---

async function populateMedicineSelect() {
    const select = document.getElementById('prescriptionMedicineSelect');
    if (!select) return;

    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/medicines`);
        const medicines = await response.json();

        medicines.forEach(med => {
            if (med.stock > 0) {
                const option = document.createElement('option');
                option.value = med.id;
                option.textContent = `${med.name} (Stok: ${med.stock})`;
                option.dataset.name = med.name;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error fetching medicines:', error);
    }
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
            medicineId: medicineId,
            medicineName: medicineName,
            quantity: quantity,
            instructions: '' // Add instructions if needed
        });
    }

    renderCurrentPrescription();
}

function removeMedicineFromPrescription(medicineId) {
    currentPrescriptionItems = currentPrescriptionItems.filter(item => item.medicineId !== medicineId);
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
                        <td><button type="button" class="btn-action-danger btn-sm" onclick="removeMedicineFromPrescription('${item.medicineId}')"><i class="fas fa-times"></i></button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// --- Helper Functions ---

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
    if (form) form.style.display = checkbox.checked ? 'block' : 'none';
    if (checkbox.checked) {
        renderCurrentPrescription();
    }
}
