// --- Initialization ---
document.addEventListener('DOMContentLoaded', async function () {
    requireRole(['apotek', 'admin']);
    await loadPharmacyData();
    setupPharmacyListeners();
});

async function loadPharmacyData() {
    await displayPrescriptions();
    await displayStockTable();
}

function setupPharmacyListeners() {
    // Modal closing logic
    window.onclick = function (event) {
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
// Note: getPrescriptions() is now from data-integration.js (Firebase)

async function displayPrescriptions() {
    const container = document.getElementById('prescriptionsList');
    const allPrescriptions = await getPrescriptions();
    const prescriptions = allPrescriptions.filter(p =>
        (p.status === 'pending' || p.status === 'pending_doctor_review') ||
        (p.status === 'processed' && p.paymentStatus === 'paid')
    );
    const medicines = await getMedicines();

    if (prescriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada resep aktif yang masuk.</p></div>`;
        return;
    }

    container.innerHTML = prescriptions.map(p => {
        let actionButton = '';
        let statusText = getPrescriptionStatusText(p.status);

        if (p.status === 'pending') {
            const items = Array.isArray(p.items) ? p.items : [];
            const allItemsAvailable = items.every(item => {
                const med = medicines.find(m => m.id === item.medicineId);
                return med && med.stok >= item.quantity;
            });

            if (allItemsAvailable) {
                actionButton = `<button class="btn-action btn-submit" onclick="processPrescription('${p.id}')"><i class="fas fa-cogs"></i> Proses & Kirim ke Kasir</button>`;
            } else {
                actionButton = `<button class="btn-action btn-danger" onclick="reportOutOfStock('${p.id}')"><i class="fas fa-exclamation-triangle"></i> Laporkan Stok Kurang</button>`;
            }
            // Add a view details button for consistency
            actionButton += `<button class="btn-action btn-secondary" onclick="viewPrescriptionDetails('${p.id}')"><i class="fas fa-eye"></i> Lihat Detail</button>`;

        } else if (p.status === 'processed' && p.paymentStatus === 'paid') {
            actionButton = `<button class="btn-action btn-complete" onclick="handOverMedicine('${p.id}')"><i class="fas fa-check-double"></i> Serahkan Obat</button>`;
            statusText = 'Siap Diambil';
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

async function viewPrescriptionDetails(prescriptionId) {
    const prescriptions = await getPrescriptions();
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    const modal = document.getElementById('prescriptionModal');
    const modalBody = document.getElementById('prescriptionModalBody');
    const footer = modal.querySelector('.modal-footer');

    const medicines = await getMedicines();
    const items = Array.isArray(prescription.items) ? prescription.items : [];

    const itemsHtml = items.map(item => {
        const med = medicines.find(m => m.id === item.medicineId);
        const isAvailable = med && med.stok >= item.quantity;
        return `<tr><td>${item.medicineName}</td><td>${item.quantity}</td><td class="${isAvailable ? 'text-success' : 'text-error'}">${isAvailable ? 'Tersedia' : 'Stok Kurang'}</td></tr>`;
    }).join('');

    modalBody.innerHTML = `
        <p><strong>Pasien:</strong> ${prescription.patientName}</p>
        <p><strong>Catatan Dokter:</strong> ${prescription.notes || '-'}</p>
        <table class="detail-table">
            <thead><tr><th>Obat</th><th>Jumlah</th><th>Ketersediaan</th></tr></thead>
            <tbody>${items.length > 0 ? itemsHtml : '<tr><td colspan="3">Tidak ada item obat.</td></tr>'}</tbody>
        </table>
    `;

    footer.innerHTML = `<button class="btn-cancel" onclick="closePrescriptionModal()">Tutup</button>`;
    modal.style.display = 'block';
}

async function reportOutOfStock(prescriptionId) {
    try {
        const prescription = (await getPrescriptions()).find(p => p.id === prescriptionId);
        if (!prescription) return;

        // Update prescription in Firebase
        await firebaseDB.collection('prescriptions').doc(prescriptionId).update({
            status: 'pending_doctor_review',
            notes: `[Stok Kurang] ${prescription.notes}`,
            updatedAt: new Date()
        });

        Swal.fire('Terkirim', 'Laporan stok kurang telah dikirim ke dokter untuk ditinjau.', 'success');
        await displayPrescriptions();
    } catch (error) {
        console.error('Error reporting out of stock:', error);
        Swal.fire('Error', 'Gagal melaporkan stok kurang.', 'error');
    }
}

async function processPrescription(prescriptionId) {
    try {
        const prescriptions = await getPrescriptions();
        const prescription = prescriptions.find(p => p.id === prescriptionId);
        if (!prescription) {
            Swal.fire('Error', 'Resep tidak ditemukan.', 'error');
            return;
        }

        const medicines = await getMedicines();
        let stockSufficient = true;
        // Double-check stock before processing
        prescription.items.forEach(item => {
            const med = medicines.find(m => m.id === item.medicineId);
            if (!med || med.stok < item.quantity) {
                stockSufficient = false;
            }
        });

        if (!stockSufficient) {
            Swal.fire('Gagal', 'Stok berubah dan tidak lagi mencukupi. Harap muat ulang dan laporkan ke dokter.', 'error');
            await displayPrescriptions();
            return;
        }

        // Deduct stock - update medicines in Firebase
        prescription.items.forEach(item => {
            const medIdx = medicines.findIndex(m => m.id === item.medicineId);
            if (medIdx > -1) {
                medicines[medIdx].stok -= item.quantity;
            }
        });
        await saveMedicines(medicines);

        // Update prescription status in Firebase
        await firebaseDB.collection('prescriptions').doc(prescriptionId).update({
            status: 'processed',
            updatedAt: new Date()
        });

        // Update queue status
        await updateQueueStatus(prescription.patientId, 'Menunggu Pembayaran');

        Swal.fire('Berhasil', 'Resep telah diproses dan dikirim ke kasir untuk pembayaran.', 'success');
        await displayPrescriptions();
    } catch (error) {
        console.error('Error processing prescription:', error);
        Swal.fire('Error', 'Gagal memproses resep.', 'error');
    }
}

async function handOverMedicine(prescriptionId) {
    try {
        const prescriptions = await getPrescriptions();
        const prescription = prescriptions.find(p => p.id === prescriptionId);
        if (!prescription) return;

        const completedPrescription = { ...prescription };

        // Update patient's main queue status to Selesai ONLY if they have no other active prescriptions
        const otherActivePrescriptions = prescriptions.filter(p => p.patientId === completedPrescription.patientId && p.id !== prescriptionId && p.status !== 'completed');
        if (otherActivePrescriptions.length === 0) {
            await updateQueueStatus(completedPrescription.patientId, 'Selesai');
        }

        // Save to pharmacy history in Firebase
        await savePharmacyHistory({
            ...completedPrescription,
            status: 'completed'
        });

        // Delete prescription from Firebase (since it's now in history)
        await firebaseDB.collection('prescriptions').doc(prescriptionId).delete();

        Swal.fire('Selesai', 'Obat telah diserahkan kepada pasien.', 'success');
        await displayPrescriptions();
    } catch (error) {
        console.error('Error handing over medicine:', error);
        Swal.fire('Error', 'Gagal menyerahkan obat.', 'error');
    }
}

function closePrescriptionModal() {
    const modal = document.getElementById('prescriptionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function refreshPrescriptions() {
    await displayPrescriptions();
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
async function displayPharmacyHistory() {
    const container = document.getElementById('pharmacyHistoryList');
    const history = await getPharmacyHistory();

    if (history.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada riwayat transaksi.</p></div>`;
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-card">
            <p><strong>Pasien:</strong> ${item.patientName} (ID: ${item.patientId})</p>
            <p><strong>Tanggal Selesai:</strong> ${item.completedAt.toDate().toLocaleString('id-ID')}</p>
            <p><strong>Catatan Dokter:</strong> ${item.notes || '-'}</p>
        </div>
    `).join('');
}


// --- Stock Management ---

async function displayStockTable() {
    const tbody = document.getElementById('stockTableBody');
    const medicines = await getMedicines();

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

async function addMedicine(event) {
    event.preventDefault();
    const medicines = await getMedicines();
    const newMed = {
        id: 'M' + Date.now(),
        nama: document.getElementById('addMedicineName').value,
        stok: parseInt(document.getElementById('addMedicineStock').value),
        harga: parseInt(document.getElementById('addMedicinePrice').value),
        golongan: document.getElementById('addMedicineGolongan').value
    };
    medicines.push(newMed);
    await saveMedicines(medicines);
    await displayStockTable();
    closeMedicineModal('add');
    document.getElementById('addMedicineForm').reset();
}

async function showEditMedicineModal(medicineId) {
    const medicines = await getMedicines();
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;

    document.getElementById('editMedicineId').value = medicine.id;
    document.getElementById('editMedicineName').value = medicine.nama;
    document.getElementById('editMedicineStock').value = medicine.stok;
    document.getElementById('editMedicinePrice').value = medicine.harga;
    document.getElementById('editMedicineGolongan').value = medicine.golongan;

    document.getElementById('editMedicineModal').style.display = 'block';
}

async function updateMedicineForm(event) {
    event.preventDefault();
    const medicines = await getMedicines();
    const medicineId = document.getElementById('editMedicineId').value;
    const idx = medicines.findIndex(m => m.id === medicineId);

    if (idx > -1) {
        medicines[idx].nama = document.getElementById('editMedicineName').value;
        medicines[idx].stok = parseInt(document.getElementById('editMedicineStock').value);
        medicines[idx].harga = parseInt(document.getElementById('editMedicinePrice').value);
        medicines[idx].golongan = document.getElementById('editMedicineGolongan').value;
        await saveMedicines(medicines);
    }

    await displayStockTable();
    closeMedicineModal('edit');
}

function showAddMedicineModal() {
    document.getElementById('addMedicineModal').style.display = 'block';
}

function closeMedicineModal(type) {
    document.getElementById(`${type}MedicineModal`).style.display = 'none';
}

