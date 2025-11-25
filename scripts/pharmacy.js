// Pharmacy Module JavaScript (API Integration)

document.addEventListener('DOMContentLoaded', function () {
    if (!requireRole(['apotek', 'admin'])) {
        return;
    }

    // Initial Load
    loadPharmacyData();
    setupPharmacyListeners();
});

function loadPharmacyData() {
    displayMedicineStock();
    displayPrescriptionQueue();
}

function setupPharmacyListeners() {
    const addMedicineForm = document.getElementById('addMedicineForm');
    if (addMedicineForm) addMedicineForm.addEventListener('submit', handleAddMedicine);

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
    }
}

// --- Medicine Inventory Management ---

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
    if (!container) {
        console.error('stockTableBody not found!');
        return;
    }

    const medicines = await getMedicines();
    console.log('Medicines loaded:', medicines);

    if (medicines.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada data obat.</td></tr>`;
        return;
    }

    container.innerHTML = medicines.map(med => `
        <tr>
            <td>${med.name}</td>
            <td>${med.category}</td>
            <td class="${med.stock < 10 ? 'text-danger' : ''}"><strong>${med.stock}</strong></td>
            <td>Rp ${med.price.toLocaleString('id-ID')}</td>
            <td>${med.unit}</td>
            <td>
                <button class="btn-action btn-sm" onclick="editMedicine('${med.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-action btn-sm btn-success" onclick="restockMedicine('${med.id}')"><i class="fas fa-plus"></i> Stok</button>
            </td>
        </tr>
    `).join('');
}

function searchMedicine(query) {
    const rows = document.querySelectorAll('#medicineStockList tbody tr');
    rows.forEach(row => {
        const medicineName = row.cells[0].textContent.toLowerCase();
        if (medicineName.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function handleAddMedicine(e) {
    e.preventDefault();

    const newMedicine = {
        name: document.getElementById('nama_obat').value,
        category: document.getElementById('kategori_obat').value,
        stock: parseInt(document.getElementById('stok_obat').value),
        price: parseInt(document.getElementById('harga_obat').value),
        unit: document.getElementById('satuan_obat').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/pharmacy/medicines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMedicine)
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire('Berhasil', 'Obat baru berhasil ditambahkan.', 'success');
            document.getElementById('addMedicineForm').reset();
            displayMedicineStock();
        } else {
            Swal.fire('Gagal', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Terjadi kesalahan koneksi.', 'error');
    }
}

async function editMedicine(id) {
    const medicines = await getMedicines();
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;

    const { value: formValues } = await Swal.fire({
        title: 'Edit Obat',
        html:
            `<input id="swal-name" class="swal2-input" placeholder="Nama Obat" value="${medicine.name}">` +
            `<input id="swal-price" type="number" class="swal2-input" placeholder="Harga" value="${medicine.price}">` +
            `<input id="swal-unit" class="swal2-input" placeholder="Satuan" value="${medicine.unit}">`,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            return {
                name: document.getElementById('swal-name').value,
                price: document.getElementById('swal-price').value,
                unit: document.getElementById('swal-unit').value
            }
        }
    });

    if (formValues) {
        const updatedData = { ...medicine, ...formValues, price: parseInt(formValues.price) };

        try {
            const response = await fetch(`${API_BASE_URL}/pharmacy/medicines/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();

            if (result.success) {
                Swal.fire('Berhasil', 'Data obat diperbarui.', 'success');
                displayMedicineStock();
            } else {
                Swal.fire('Gagal', result.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memperbarui obat.', 'error');
        }
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

// --- Prescription Processing ---

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

    const prescriptions = await getPendingPrescriptions();
    console.log('Prescriptions received:', prescriptions);

    if (prescriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada resep yang perlu diproses saat ini.</p></div>`;
        return;
    }

    container.innerHTML = prescriptions.map(p => {
        console.log('Prescription items:', p.items);
        const itemsHTML = (p.items && p.items.length > 0)
            ? p.items.map(item => `
                <li>${item.medicineName} - ${item.quantity} ${item.instructions ? `(${item.instructions})` : ''}</li>
            `).join('')
            : '<li>Tidak ada obat dalam resep</li>';

        return `
        <div class="prescription-card">
            <div class="prescription-header">
                <h4>${p.patientName}</h4>
                <span class="badge badge-warning">Menunggu Obat</span>
            </div>
            <div class="prescription-details">
                <p><strong>Tanggal:</strong> ${new Date(p.date).toLocaleString('id-ID')}</p>
                <div class="medicine-list">
                    <strong>Resep:</strong>
                    <ul>
                        ${itemsHTML}
                    </ul>
                </div>
            </div>
            <div class="prescription-actions">
                <button class="btn-action btn-success" onclick="processPrescription('${p.visitId}')">
                    <i class="fas fa-check"></i> Proses & Selesai
                </button>
            </div>
        </div>
        `;
    }).join('');
}

async function processPrescription(visitId) {
    Swal.fire({
        title: 'Proses Resep?',
        text: "Stok obat akan dikurangi dan pasien akan diarahkan ke kasir.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Proses!',
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
                    Swal.fire('Berhasil!', 'Resep telah diproses.', 'success');
                    displayPrescriptionQueue();
                    displayMedicineStock(); // Update stock display
                } else {
                    Swal.fire('Gagal', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal memproses resep.', 'error');
            }
        }
    });
}

function refreshPharmacyData() {
    loadPharmacyData();
}

function refreshPrescriptions() {
    displayPrescriptionQueue();
}

function showAddMedicineModal() {
    const modal = document.getElementById('addMedicineModal');
    if (modal) modal.style.display = 'block';
}

function closeMedicineModal(type) {
    const modal = document.getElementById(type === 'add' ? 'addMedicineModal' : 'editMedicineModal');
    if (modal) modal.style.display = 'none';
}
