// Pharmacy Module JavaScript

let prescriptions = [];
let medicines = [
    { id: 'M001', nama: 'Paracetamol 500mg', stok: 150, harga: 5000 },
    { id: 'M002', nama: 'Amoxicillin 500mg', stok: 80, harga: 15000 },
    { id: 'M003', nama: 'Ibuprofen 400mg', stok: 120, harga: 8000 },
    { id: 'M004', nama: 'Cetirizine 10mg', stok: 90, harga: 12000 },
    { id: 'M005', nama: 'Omeprazole 20mg', stok: 60, harga: 20000 }
];

let processedPrescriptions = [];

// Tab switching
function switchPharmacyTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'prescriptions') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('prescriptionsTab').classList.add('active');
        loadPrescriptions();
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('stockTab').classList.add('active');
        displayStockTable();
    }
}

// Load prescriptions from examination module
function loadPrescriptions() {
    // In real app, fetch from API
    // For now, check localStorage or use sample data
    const savedPrescriptions = localStorage.getItem('pendingPrescriptions');
    if (savedPrescriptions) {
        prescriptions = JSON.parse(savedPrescriptions);
    } else {
        // Sample prescription data
        prescriptions = [
            {
                id: 'PR001',
                patientId: 'P001',
                patientName: 'Ahmad Wijaya',
                date: new Date().toISOString(),
                notes: 'Obat untuk demam dan sakit kepala',
                status: 'pending',
                items: [
                    { medicineId: 'M001', medicineName: 'Paracetamol 500mg', quantity: 2, dosage: '3x1 setelah makan' }
                ]
            }
        ];
    }
    
    displayPrescriptions();
}

// Display prescriptions
function displayPrescriptions() {
    const container = document.getElementById('prescriptionsList');
    
    if (prescriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-prescription"></i>
                <p>Belum ada resep yang masuk</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = prescriptions.map(prescription => `
        <div class="prescription-card">
            <div class="prescription-header">
                <div>
                    <h4>Resep #${prescription.id}</h4>
                    <p class="prescription-patient">Pasien: ${prescription.patientName}</p>
                    <p class="prescription-date">${new Date(prescription.date).toLocaleDateString('id-ID')}</p>
                </div>
                <div class="prescription-status status-${prescription.status}">
                    ${getPrescriptionStatusText(prescription.status)}
                </div>
            </div>
            <div class="prescription-items">
                <strong>Daftar Obat:</strong>
                <ul>
                    ${prescription.items.map(item => `
                        <li>${item.medicineName} - ${item.quantity} box (${item.dosage})</li>
                    `).join('')}
                </ul>
            </div>
            ${prescription.notes ? `
            <div class="prescription-notes">
                <strong>Catatan:</strong> ${prescription.notes}
            </div>
            ` : ''}
            <div class="prescription-actions">
                ${prescription.status === 'pending' ? `
                <button class="btn-action btn-select" onclick="viewPrescription('${prescription.id}')">
                    <i class="fas fa-eye"></i> Lihat Detail
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// View prescription details
function viewPrescription(prescriptionId) {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    const modal = document.getElementById('prescriptionModal');
    const modalBody = document.getElementById('prescriptionModalBody');
    
    modalBody.innerHTML = `
        <div class="prescription-detail">
            <div class="detail-section">
                <h4>Informasi Pasien</h4>
                <p><strong>Nama:</strong> ${prescription.patientName}</p>
                <p><strong>ID Pasien:</strong> ${prescription.patientId}</p>
                <p><strong>Tanggal:</strong> ${new Date(prescription.date).toLocaleDateString('id-ID')}</p>
            </div>
            <div class="detail-section">
                <h4>Daftar Obat</h4>
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Nama Obat</th>
                            <th>Jumlah</th>
                            <th>Dosis</th>
                            <th>Stok Tersedia</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prescription.items.map(item => {
                            const medicine = medicines.find(m => m.id === item.medicineId);
                            const available = medicine ? medicine.stok : 0;
                            const canFulfill = available >= item.quantity;
                            
                            return `
                                <tr>
                                    <td>${item.medicineName}</td>
                                    <td>${item.quantity} box</td>
                                    <td>${item.dosage}</td>
                                    <td>${available}</td>
                                    <td>
                                        <span class="status-badge ${canFulfill ? 'status-success' : 'status-error'}">
                                            ${canFulfill ? 'Tersedia' : 'Stok Kurang'}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${prescription.notes ? `
            <div class="detail-section">
                <h4>Catatan</h4>
                <p>${prescription.notes}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
    modal.dataset.prescriptionId = prescriptionId;
}

// Process prescription
function processPrescription() {
    const prescriptionId = document.getElementById('prescriptionModal').dataset.prescriptionId;
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    
    if (!prescription) return;
    
    // Check if all medicines are available
    let allAvailable = true;
    const unavailableMedicines = [];
    
    prescription.items.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medicineId);
        if (!medicine || medicine.stok < item.quantity) {
            allAvailable = false;
            unavailableMedicines.push(item.medicineName);
        }
    });
    
    if (!allAvailable) {
        alert(`Tidak dapat memproses resep. Obat berikut stoknya kurang:\n${unavailableMedicines.join('\n')}`);
        return;
    }
    
    // Deduct stock
    prescription.items.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medicineId);
        if (medicine) {
            medicine.stok -= item.quantity;
        }
    });
    
    // Update prescription status
    prescription.status = 'processed';
    processedPrescriptions.push(prescription);
    prescriptions = prescriptions.filter(p => p.id !== prescriptionId);
    
    // Save to localStorage
    localStorage.setItem('medicines', JSON.stringify(medicines));
    localStorage.setItem('processedPrescriptions', JSON.stringify(processedPrescriptions));
    localStorage.setItem('pendingPrescriptions', JSON.stringify(prescriptions));
    
    alert('Resep berhasil diproses! Stok obat telah dikurangi.');
    closePrescriptionModal();
    displayPrescriptions();
    displayStockTable();
}

// Close prescription modal
function closePrescriptionModal() {
    document.getElementById('prescriptionModal').style.display = 'none';
}

// Display stock table
function displayStockTable() {
    const tbody = document.getElementById('stockTableBody');
    
    if (medicines.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state">
                        <i class="fas fa-boxes"></i>
                        <p>Belum ada data obat</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = medicines.map(medicine => {
        const stockStatus = medicine.stok > 20 ? 'status-success' : medicine.stok > 10 ? 'status-warning' : 'status-error';
        const statusText = medicine.stok > 20 ? 'Aman' : medicine.stok > 10 ? 'Menipis' : 'Habis';
        
        return `
            <tr>
                <td><strong>${medicine.nama}</strong></td>
                <td>${medicine.stok}</td>
                <td>Rp ${medicine.harga.toLocaleString('id-ID')}</td>
                <td>
                    <span class="status-badge ${stockStatus}">${statusText}</span>
                </td>
                <td>
                    <button class="btn-action btn-edit" onclick="editStock('${medicine.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search medicine
function searchMedicine(query) {
    const tbody = document.getElementById('stockTableBody');
    const searchTerm = query.toLowerCase();
    
    if (!searchTerm) {
        displayStockTable();
        return;
    }
    
    const filtered = medicines.filter(medicine => 
        medicine.nama.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Obat tidak ditemukan</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(medicine => {
        const stockStatus = medicine.stok > 20 ? 'status-success' : medicine.stok > 10 ? 'status-warning' : 'status-error';
        const statusText = medicine.stok > 20 ? 'Aman' : medicine.stok > 10 ? 'Menipis' : 'Habis';
        
        return `
            <tr>
                <td><strong>${medicine.nama}</strong></td>
                <td>${medicine.stok}</td>
                <td>Rp ${medicine.harga.toLocaleString('id-ID')}</td>
                <td>
                    <span class="status-badge ${stockStatus}">${statusText}</span>
                </td>
                <td>
                    <button class="btn-action btn-edit" onclick="editStock('${medicine.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show add medicine modal
function showAddMedicineModal() {
    document.getElementById('addMedicineModal').style.display = 'block';
}

// Close add medicine modal
function closeAddMedicineModal() {
    document.getElementById('addMedicineModal').style.display = 'none';
    document.getElementById('addMedicineForm').reset();
}

// Add medicine
function addMedicine() {
    const name = document.getElementById('medicineName').value;
    const stock = parseInt(document.getElementById('medicineStock').value);
    const price = parseInt(document.getElementById('medicinePrice').value);
    
    if (!name || stock < 0 || price < 0) {
        alert('Mohon isi semua field dengan benar');
        return;
    }
    
    const newMedicine = {
        id: 'M' + String(medicines.length + 1).padStart(3, '0'),
        nama: name,
        stok: stock,
        harga: price
    };
    
    medicines.push(newMedicine);
    localStorage.setItem('medicines', JSON.stringify(medicines));
    
    alert('Obat berhasil ditambahkan!');
    closeAddMedicineModal();
    displayStockTable();
}

// Edit stock
function editStock(medicineId) {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    const newStock = prompt(`Edit stok untuk ${medicine.nama}\nStok saat ini: ${medicine.stok}`, medicine.stok);
    
    if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
        medicine.stok = parseInt(newStock);
        localStorage.setItem('medicines', JSON.stringify(medicines));
        displayStockTable();
        alert('Stok berhasil diperbarui!');
    }
}

// Refresh prescriptions
function refreshPrescriptions() {
    loadPrescriptions();
}

// Get prescription status text
function getPrescriptionStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu',
        'processed': 'Diproses',
        'completed': 'Selesai'
    };
    return statusMap[status] || status;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved medicines
    const savedMedicines = localStorage.getItem('medicines');
    if (savedMedicines) {
        medicines = JSON.parse(savedMedicines);
    }
    
    // Load prescriptions
    loadPrescriptions();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const prescriptionModal = document.getElementById('prescriptionModal');
        const addMedicineModal = document.getElementById('addMedicineModal');
        
        if (event.target === prescriptionModal) {
            closePrescriptionModal();
        }
        if (event.target === addMedicineModal) {
            closeAddMedicineModal();
        }
    };
});

