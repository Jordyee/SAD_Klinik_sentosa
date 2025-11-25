// Pharmacy Module JavaScript (API Integration)

// Expose functions globally
window.refreshPrescriptions = refreshPrescriptions;
window.refreshHandover = refreshHandover;
window.refreshHistory = refreshHistory;
window.processPrescription = processPrescription;
window.handoverMedicine = handoverMedicine;
window.showAddMedicineModal = showAddMedicineModal;
window.closeMedicineModal = closeMedicineModal;
window.addMedicine = addMedicine;
window.updateMedicine = updateMedicine;
window.editMedicine = editMedicine;
window.restockMedicine = restockMedicine;
window.searchMedicine = searchMedicine;
window.closePrescriptionModal = closePrescriptionModal;

document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireRole === 'function') {
        if (!requireRole(['apotek', 'admin'])) {
            return;
        }
    }

    // Initial Load
    loadPharmacyData();
    setupPharmacyListeners();
});

function loadPharmacyData() {
    displayPrescriptionQueue(); // Default tab
}

function setupPharmacyListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchPharmacyTab(tab);
        });
    });
}

function switchPharmacyTab(tab) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');

    // Load data for the selected tab
    if (tab === 'stock') {
        displayMedicineStock();
    } else if (tab === 'prescriptions') {
        displayPrescriptionQueue();
    } else if (tab === 'handover') {
        displayHandoverQueue();
    } else if (tab === 'history') {
        displayPharmacyHistory();
    }
}

// --- 1. Incoming Prescriptions (Resep Masuk) ---

async function getPendingPrescriptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/prescriptions/pending`);
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return [];
    }
}

async function displayPrescriptionQueue() {
    const container = document.getElementById('prescriptionsList');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Memuat...</div>';

    const prescriptions = await getPendingPrescriptions();

    if (prescriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada resep baru yang perlu diproses.</p></div>`;
        return;
    }

    container.innerHTML = prescriptions.map(p => {
        const itemsHTML = (p.items && p.items.length > 0)
            ? p.items.map(item => `<li>${item.medicineName} - ${item.quantity} ${item.instructions ? `(${item.instructions})` : ''}</li>`).join('')
            : '<li>Tidak ada obat</li>';

        return `
        <div class="prescription-card">
            <div class="prescription-header">
                <h4>${p.patientName}</h4>
                <span class="badge badge-warning">Menunggu Konfirmasi</span>
            </div>
            <div class="prescription-details">
                <p><strong>Tanggal:</strong> ${new Date(p.date).toLocaleString('id-ID')}</p>
                <div class="medicine-list">
                    <strong>Resep:</strong>
                    <ul>${itemsHTML}</ul>
                </div>
            </div>
            <div class="prescription-actions">
                <button class="btn-action btn-primary" onclick="processPrescription('${p.visitId}')">
                    <i class="fas fa-check-circle"></i> Konfirmasi & Teruskan ke Kasir
                </button>
            </div>
        </div>
        `;
    }).join('');
}

async function processPrescription(visitId) {
    Swal.fire({
        title: 'Konfirmasi Resep?',
        text: "Stok obat akan dikurangi/disiapkan dan data diteruskan ke Kasir untuk pembayaran.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Proses',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/pharmacy/prescriptions/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visitId })
                });
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Berhasil', 'Resep diteruskan ke bagian pembayaran.', 'success');
                    displayPrescriptionQueue();
                } else {
                    Swal.fire('Gagal', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal memproses resep.', 'error');
            }
        }
    });
}

// --- 2. Handover (Penyerahan Obat) ---

async function getReadyPrescriptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/prescriptions/ready`);
        if (!response.ok) throw new Error('Failed to fetch ready prescriptions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching ready prescriptions:', error);
        return [];
    }
}

async function displayHandoverQueue() {
    const container = document.getElementById('handoverList');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Memuat...</div>';

    const prescriptions = await getReadyPrescriptions();

    if (prescriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada obat yang siap diserahkan (Menunggu pembayaran).</p></div>`;
        return;
    }

    container.innerHTML = prescriptions.map(p => {
        const itemsHTML = (p.items && p.items.length > 0)
            ? p.items.map(item => `<li>${item.medicineName} - ${item.quantity}</li>`).join('')
            : '<li>Tidak ada obat</li>';

        return `
        <div class="prescription-card ready-card">
            <div class="prescription-header">
                <h4>${p.patientName}</h4>
                <span class="badge badge-success">Sudah Bayar</span>
            </div>
            <div class="prescription-details">
                <div class="medicine-list">
                    <strong>Obat Siap Serah:</strong>
                    <ul>${itemsHTML}</ul>
                </div>
            </div>
            <div class="prescription-actions">
                <button class="btn-action btn-success" onclick="handoverMedicine('${p.visitId}')">
                    <i class="fas fa-hand-holding-heart"></i> Serahkan Obat
                </button>
            </div>
        </div>
        `;
    }).join('');
}

async function handoverMedicine(visitId) {
    Swal.fire({
        title: 'Serahkan Obat?',
        text: "Pastikan pasien menerima obat dengan benar. Transaksi akan selesai.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Serahkan',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/pharmacy/prescriptions/handover`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visitId })
                });
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Selesai', 'Obat telah diserahkan. Workflow pasien selesai.', 'success');
                    displayHandoverQueue();
                } else {
                    Swal.fire('Gagal', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal memproses penyerahan.', 'error');
            }
        }
    });
}

// --- 3. Medicine Stock Management ---

async function getMedicines() {
    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/medicines`);
        if (!response.ok) throw new Error('Failed to fetch medicines');
        return await response.json();
    } catch (error) {
        console.error('Error fetching medicines:', error);
        return [];
    }
}

async function displayMedicineStock() {
    const container = document.getElementById('stockTableBody');
    if (!container) return;

    const medicines = await getMedicines();

    if (medicines.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada data obat.</td></tr>`;
        return;
    }

    container.innerHTML = medicines.map(med => `
        <tr>
            <td>${med.name}</td>
            <td>${med.stock}</td>
            <td>Rp ${med.price.toLocaleString('id-ID')}</td>
            <td>${med.stock < 10 ? '<span class="text-danger">Stok Menipis</span>' : '<span class="text-success">Aman</span>'}</td>
            <td>
                <button class="btn-action btn-sm" onclick="editMedicine('${med.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-action btn-sm btn-success" onclick="restockMedicine('${med.id}')"><i class="fas fa-plus"></i></button>
            </td>
        </tr>
    `).join('');
}

// --- 4. History ---

async function displayPharmacyHistory() {
    const container = document.getElementById('pharmacyHistoryList');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Memuat...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/history`);
        const history = await response.json();

        if (history.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>Belum ada riwayat pengambilan obat.</p></div>`;
            return;
        }

        // Sort by date desc (assuming date is available, otherwise just reverse)
        history.reverse();

        container.innerHTML = history.map(h => `
            <div class="history-card">
                <div class="history-header">
                    <strong>${h.patientName}</strong>
                    <span class="text-muted">${new Date(h.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div class="history-details">
                    <small>Obat: ${h.items.map(i => i.medicineName).join(', ')}</small>
                    <span class="status-badge status-success">Selesai</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        container.innerHTML = '<div class="empty-state"><p>Gagal memuat riwayat.</p></div>';
    }
}

// --- Helper Functions ---

function refreshPrescriptions() { displayPrescriptionQueue(); }
function refreshHandover() { displayHandoverQueue(); }
function refreshHistory() { displayPharmacyHistory(); }

function searchMedicine(query) {
    const rows = document.querySelectorAll('#stockTableBody tr');
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        row.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
    });
}

// Modal Functions (Add/Edit/Restock) - Simplified for brevity but fully functional
function showAddMedicineModal() { document.getElementById('addMedicineModal').style.display = 'block'; }
function closeMedicineModal(type) { document.getElementById(type === 'add' ? 'addMedicineModal' : 'editMedicineModal').style.display = 'none'; }
function closePrescriptionModal() { document.getElementById('prescriptionModal').style.display = 'none'; }

async function addMedicine(e) {
    e.preventDefault();
    const newMedicine = {
        name: document.getElementById('addMedicineName').value,
        stock: parseInt(document.getElementById('addMedicineStock').value),
        price: parseInt(document.getElementById('addMedicinePrice').value),
        category: document.getElementById('addMedicineGolongan').value,
        unit: 'pcs' // Default
    };

    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/medicines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMedicine)
        });
        if ((await response.json()).success) {
            Swal.fire('Berhasil', 'Obat ditambahkan', 'success');
            closeMedicineModal('add');
            displayMedicineStock();
        }
    } catch (err) { Swal.fire('Error', 'Gagal menambah obat', 'error'); }
}

async function editMedicine(id) {
    const medicines = await getMedicines();
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;

    // Populate Modal
    document.getElementById('editMedicineId').value = medicine.id;
    document.getElementById('editMedicineName').value = medicine.name;
    document.getElementById('editMedicineStock').value = medicine.stock;
    document.getElementById('editMedicinePrice').value = medicine.price;
    document.getElementById('editMedicineGolongan').value = medicine.category || 'Bebas';

    // Show Modal
    document.getElementById('editMedicineModal').style.display = 'block';
}

async function updateMedicine(e) {
    e.preventDefault();

    const id = document.getElementById('editMedicineId').value;
    const updatedData = {
        name: document.getElementById('editMedicineName').value,
        stock: parseInt(document.getElementById('editMedicineStock').value),
        price: parseInt(document.getElementById('editMedicinePrice').value),
        category: document.getElementById('editMedicineGolongan').value,
        unit: 'pcs' // Preserve or update unit if field exists
    };

    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/medicines/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire('Berhasil', 'Data obat diperbarui.', 'success');
            closeMedicineModal('edit');
            displayMedicineStock();
        } else {
            Swal.fire('Gagal', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Gagal memperbarui obat.', 'error');
    }
}

async function restockMedicine(id) {
    const { value: amount } = await Swal.fire({
        title: 'Tambah Stok',
        input: 'number',
        inputLabel: 'Jumlah stok yang akan ditambahkan',
        inputPlaceholder: 'Contoh: 50',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value || value <= 0) {
                return 'Masukkan jumlah yang valid!'
            }
        }
    });

    if (amount) {
        const medicines = await getMedicines();
        const medicine = medicines.find(m => m.id === id);
        if (medicine) {
            const newStock = medicine.stock + parseInt(amount);
            const updatedData = { ...medicine, stock: newStock };

            try {
                const response = await fetch(`${API_BASE_URL}/pharmacy/medicines/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                const result = await response.json();

                if (result.success) {
                    Swal.fire('Berhasil', `Stok berhasil ditambahkan. Total sekarang: ${newStock}`, 'success');
                    displayMedicineStock();
                } else {
                    Swal.fire('Gagal', result.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal menambah stok.', 'error');
            }
        }
    }
}
