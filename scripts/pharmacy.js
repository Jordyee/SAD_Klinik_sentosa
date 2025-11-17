// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    requireRole(['apotek', 'admin']);
    loadPharmacyData();
    setupPharmacyListeners();
});

function loadPharmacyData() {
    displayPrescriptions();
    displayStockTable();
}

function setupPharmacyListeners() {
    // Modal closing logic
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };

    // New, robust tab switching logic
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');

            // Refresh content on tab switch
            if (tabName === 'stock') displayStockTable();
            else if (tabName === 'history') displayPharmacyHistory();
            else displayPrescriptions();
        });
    });
}

// --- Prescription Handling ---
function getPrescriptions() { return JSON.parse(localStorage.getItem('pendingPrescriptions') || '[]'); }
function savePrescriptions(prescriptions) { localStorage.setItem('pendingPrescriptions', JSON.stringify(prescriptions)); }

function displayPrescriptions() {
    const container = document.getElementById('prescriptionsList');
    const prescriptions = getPrescriptions().filter(p => p.status !== 'completed' && p.status !== 'cancelled');
    const queue = getQueue();

    if (prescriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada resep aktif yang masuk.</p></div>`;
        return;
    }
    
    container.innerHTML = prescriptions.map(p => {
        const patientInQueue = queue.find(item => item.patient.patientId === p.patientId);
        const patientStatus = patientInQueue ? patientInQueue.status : 'N/A';
        
        let actionButton = '';
        let statusText = getPrescriptionStatusText(p.status);

        if (p.status === 'pending') {
            actionButton = `<button class="btn-action btn-select" onclick="viewPrescription('${p.id}')"><i class="fas fa-cogs"></i> Proses Resep</button>`;
        } else if (p.status === 'processed' && patientStatus === 'Menunggu Pengambilan Obat') {
            actionButton = `<button class="btn-action btn-complete" onclick="handOverMedicine('${p.id}')"><i class="fas fa-check-double"></i> Serahkan Obat</button>`;
            statusText = 'Siap Diambil';
        } else if (p.status === 'processed') {
            actionButton = `<p class="info-text">Menunggu pembayaran di kasir...</p>`;
            statusText = 'Menunggu Pembayaran';
        } else if (p.status === 'pending_doctor_review') {
            actionButton = `<p class="info-text text-danger">Menunggu tinjauan dokter...</p>`;
        }

        return `
            <div class="prescription-card status-${p.status}">
                <div class="card-header">
                    <h4>Resep untuk: ${p.patientName}</h4>
                    <span class="status-badge status-${p.status}">${statusText}</span>
                </div>
                <div class="card-body">
                    <p><strong>Tanggal:</strong> ${new Date(p.date).toLocaleDateString('id-ID')}</p>
                    <p><strong>Catatan Dokter:</strong> ${p.notes || '-'}</p>
                </div>
                <div class="card-footer">
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');
}

function viewPrescription(prescriptionId) {
    const prescription = getPrescriptions().find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    const modal = document.getElementById('prescriptionModal');
    const modalBody = document.getElementById('prescriptionModalBody');
    const footer = modal.querySelector('.modal-footer');

    // Store the id on the modal for other functions to use
    modal.dataset.prescriptionId = prescriptionId;

    const medicines = getMedicines();
    let allItemsAvailable = true;
    let unavailableItems = [];

    // Ensure prescription.items is an array
    const items = Array.isArray(prescription.items) ? prescription.items : [];

    const itemsHtml = items.map(item => {
        const med = medicines.find(m => m.id === item.medicineId);
        const isAvailable = med && med.stok >= item.quantity;
        if (!isAvailable) {
            allItemsAvailable = false;
            unavailableItems.push(item.medicineName);
        }
        return `<tr><td>${item.medicineName}</td><td>${item.quantity}</td><td class="${isAvailable ? 'text-success' : 'text-error'}">${isAvailable ? 'Tersedia' : 'Stok Kurang'}</td></tr>`;
    }).join('');

    modalBody.innerHTML = `
        <p><strong>Pasien:</strong> ${prescription.patientName}</p>
        <p><strong>Catatan Dokter:</strong> ${prescription.notes || '-'}</p>
        <table class="detail-table">
            <thead><tr><th>Obat</th><th>Jumlah</th><th>Ketersediaan</th></tr></thead>
            <tbody>${items.length > 0 ? itemsHtml : '<tr><td colspan="3">Tidak ada item obat dalam resep ini.</td></tr>'}</tbody>
        </table>
    `;
    
    if (allItemsAvailable) {
        footer.innerHTML = `<button class="btn-cancel" onclick="closePrescriptionModal()">Batal</button><button class="btn-submit" onclick="processPrescription()">Proses & Siapkan Obat</button>`;
    } else {
        footer.innerHTML = `
            <p class="text-error">Stok obat tidak mencukupi. Harap informasikan ke dokter.</p>
            <button class="btn-cancel" onclick="closePrescriptionModal()">Tutup</button>
            <button class="btn-danger" onclick="reportOutOfStock()">Laporkan Stok Kurang</button>
        `;
    }

    modal.style.display = 'block';
}

function reportOutOfStock() {
    const modal = document.getElementById('prescriptionModal');
    const prescriptionId = modal.dataset.prescriptionId;
    let prescriptions = getPrescriptions();
    const idx = prescriptions.findIndex(p => p.id === prescriptionId);
    if (idx === -1) return;

    // This part is simplified, in a real app you'd get the specific unavailable items
    prescriptions[idx].status = 'pending_doctor_review';
    prescriptions[idx].notes = `[Stok Kurang] ${prescriptions[idx].notes}`;
    savePrescriptions(prescriptions);

    Swal.fire('Terkirim', 'Laporan stok kurang telah dikirim ke dokter untuk ditinjau.', 'success');
    closePrescriptionModal();
    displayPrescriptions();
}

function processPrescription() {
    const modal = document.getElementById('prescriptionModal');
    const prescriptionId = modal.dataset.prescriptionId;
    let prescriptions = getPrescriptions();
    const idx = prescriptions.findIndex(p => p.id === prescriptionId);
    if (idx === -1) return;
    
    // Deduct stock
    const medicines = getMedicines();
    let stockSufficient = true;
    prescriptions[idx].items.forEach(item => {
        const medIdx = medicines.findIndex(m => m.id === item.medicineId);
        if (medIdx > -1 && medicines[medIdx].stok >= item.quantity) {
            medicines[medIdx].stok -= item.quantity;
        } else {
            stockSufficient = false;
        }
    });

    if (!stockSufficient) {
        Swal.fire('Gagal', 'Stok berubah dan tidak lagi mencukupi. Harap laporkan ke dokter.', 'error');
        return;
    }

    saveMedicines(medicines);

    prescriptions[idx].status = 'processed';
    savePrescriptions(prescriptions);
    updateQueueStatus(prescriptions[idx].patientId, 'Menunggu Pembayaran');
    
    Swal.fire('Berhasil', 'Resep diproses. Pasien diarahkan ke kasir.', 'success');
    closePrescriptionModal();
    displayPrescriptions();
}

function handOverMedicine(prescriptionId) {
    let prescriptions = getPrescriptions();
    const idx = prescriptions.findIndex(p => p.id === prescriptionId);
    if (idx === -1) return;

    const completedPrescription = { ...prescriptions[idx] };

    // Update patient's main queue status to Selesai ONLY if they have no other active prescriptions
    const otherActivePrescriptions = prescriptions.filter(p => p.patientId === completedPrescription.patientId && p.id !== prescriptionId && p.status !== 'completed');
    if (otherActivePrescriptions.length === 0) {
        updateQueueStatus(completedPrescription.patientId, 'Selesai');
    }
    
    // Move the completed prescription to history
    const history = JSON.parse(localStorage.getItem('pharmacyHistory') || '[]');
    history.push({
        ...completedPrescription,
        status: 'completed',
        completedAt: new Date().toISOString()
    });
    localStorage.setItem('pharmacyHistory', JSON.stringify(history));

    // Remove from active prescriptions
    prescriptions.splice(idx, 1);
    savePrescriptions(prescriptions);

    Swal.fire('Selesai', 'Obat telah diserahkan kepada pasien.', 'success');
    displayPrescriptions();
}

function closePrescriptionModal() {
    const modal = document.getElementById('prescriptionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function refreshPrescriptions() { 
    displayPrescriptions(); 
}

function getPrescriptionStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu Diproses',
        'processed': 'Diproses',
        'pending_doctor_review': 'Menunggu Tinjauan Dokter',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
}

// --- History ---
function displayPharmacyHistory() {
    const container = document.getElementById('pharmacyHistoryList');
    const history = JSON.parse(localStorage.getItem('pharmacyHistory') || '[]');

    if (history.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada riwayat transaksi.</p></div>`;
        return;
    }

    container.innerHTML = history.slice().reverse().map(item => `
        <div class="history-card">
            <p><strong>Pasien:</strong> ${item.patientName} (ID: ${item.patientId})</p>
            <p><strong>Tanggal Selesai:</strong> ${new Date(item.completedAt).toLocaleString('id-ID')}</p>
            <p><strong>Catatan Dokter:</strong> ${item.notes || '-'}</p>
        </div>
    `).join('');
}


// --- Stock Management ---

function getMedicines() { return JSON.parse(localStorage.getItem('medicines') || '[]'); }
function saveMedicines(medicines) { localStorage.setItem('medicines', JSON.stringify(medicines)); }

function displayStockTable() {
    const tbody = document.getElementById('stockTableBody');
    const medicines = getMedicines();
    
    tbody.innerHTML = medicines.map(med => {
        const stockStatus = med.stok > 20 ? 'status-success' : med.stok > 0 ? 'status-warning' : 'status-error';
        return `
            <tr>
                <td><strong>${med.nama}</strong></td>
                <td>${med.golongan}</td>
                <td>${med.stok}</td>
                <td>Rp ${med.harga.toLocaleString('id-ID')}</td>
                <td><span class="status-badge ${stockStatus}">${med.stok > 0 ? 'Tersedia' : 'Habis'}</span></td>
                <td><button class="btn-action btn-edit" onclick="showEditMedicineModal('${med.id}')"><i class="fas fa-edit"></i> Edit</button></td>
            </tr>
        `;
    }).join('');
}

function addMedicine(event) {
    event.preventDefault();
    const medicines = getMedicines();
    const newMed = {
        id: 'M' + Date.now(),
        nama: document.getElementById('addMedicineName').value,
        stok: parseInt(document.getElementById('addMedicineStock').value),
        harga: parseInt(document.getElementById('addMedicinePrice').value),
        golongan: document.getElementById('addMedicineGolongan').value
    };
    medicines.push(newMed);
    saveMedicines(medicines);
    displayStockTable();
    closeMedicineModal('add');
    document.getElementById('addMedicineForm').reset();
}

function showEditMedicineModal(medicineId) {
    const medicine = getMedicines().find(m => m.id === medicineId);
    if (!medicine) return;

    document.getElementById('editMedicineId').value = medicine.id;
    document.getElementById('editMedicineName').value = medicine.nama;
    document.getElementById('editMedicineStock').value = medicine.stok;
    document.getElementById('editMedicinePrice').value = medicine.harga;
    document.getElementById('editMedicineGolongan').value = medicine.golongan;

    document.getElementById('editMedicineModal').style.display = 'block';
}

function updateMedicine(event) {
    event.preventDefault();
    const medicines = getMedicines();
    const medicineId = document.getElementById('editMedicineId').value;
    const idx = medicines.findIndex(m => m.id === medicineId);

    if (idx > -1) {
        medicines[idx].nama = document.getElementById('editMedicineName').value;
        medicines[idx].stok = parseInt(document.getElementById('editMedicineStock').value);
        medicines[idx].harga = parseInt(document.getElementById('editMedicinePrice').value);
        medicines[idx].golongan = document.getElementById('editMedicineGolongan').value;
        saveMedicines(medicines);
    }

    displayStockTable();
    closeMedicineModal('edit');
}

function showAddMedicineModal() {
    document.getElementById('addMedicineModal').style.display = 'block';
}

function closeMedicineModal(type) {
    document.getElementById(`${type}MedicineModal`).style.display = 'none';
}

