// Billing Module JavaScript

let completedVisits = [];
let paymentHistory = [];
const biayaPemeriksaanDefault = 50000; // Default examination fee

// Load billing data
function loadBillingData() {
    // Load completed visits from examination
    const savedRecords = localStorage.getItem('medicalRecords');
    const savedPrescriptions = localStorage.getItem('processedPrescriptions');
    
    if (savedRecords) {
        const records = JSON.parse(savedRecords);
        completedVisits = records.map(record => ({
            patientId: record.patientId,
            date: record.date,
            hasPrescription: record.needsPrescription || false
        }));
    }
    
    // Load payment history
    const savedPayments = localStorage.getItem('paymentHistory');
    if (savedPayments) {
        paymentHistory = JSON.parse(savedPayments);
    }
    
    populateBillingPatientSelect();
    displayPaymentHistory();
}

// Populate patient select
function populateBillingPatientSelect() {
    const select = document.getElementById('billingPatientSelect');
    
    // Get unique patient IDs from completed visits
    const uniquePatients = [...new Set(completedVisits.map(v => v.patientId))];
    
    // Get patient data from queue
    const savedQueue = localStorage.getItem('patientQueue');
    let patients = [];
    if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        patients = queue.map(item => item.patient);
    }
    
    // Clear existing options except first
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    uniquePatients.forEach(patientId => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const option = document.createElement('option');
            option.value = patientId;
            option.textContent = `${patient.nama} (${patientId})`;
            select.appendChild(option);
        }
    });
}

// Load billing data for selected patient
function loadBillingData(patientId) {
    const billingDetails = document.getElementById('billingDetails');
    const visit = completedVisits.find(v => v.patientId === patientId);
    
    if (!visit) {
        alert('Data kunjungan tidak ditemukan');
        return;
    }
    
    // Calculate examination fee
    const biayaPemeriksaan = biayaPemeriksaanDefault;
    
    // Calculate medicine fee
    let biayaObat = 0;
    const savedPrescriptions = localStorage.getItem('processedPrescriptions');
    if (savedPrescriptions) {
        const prescriptions = JSON.parse(savedPrescriptions);
        const patientPrescription = prescriptions.find(p => p.patientId === patientId);
        
        if (patientPrescription) {
            // Get medicine prices
            const savedMedicines = localStorage.getItem('medicines');
            if (savedMedicines) {
                const medicines = JSON.parse(savedMedicines);
                patientPrescription.items.forEach(item => {
                    const medicine = medicines.find(m => m.id === item.medicineId);
                    if (medicine) {
                        biayaObat += medicine.harga * item.quantity;
                    }
                });
            }
        }
    }
    
    const totalBayar = biayaPemeriksaan + biayaObat;
    
    // Update display
    document.getElementById('biayaPemeriksaan').textContent = `Rp ${biayaPemeriksaan.toLocaleString('id-ID')}`;
    document.getElementById('biayaObat').textContent = `Rp ${biayaObat.toLocaleString('id-ID')}`;
    document.getElementById('totalBayar').innerHTML = `<strong>Rp ${totalBayar.toLocaleString('id-ID')}</strong>`;
    
    // Store billing data
    billingDetails.dataset.patientId = patientId;
    billingDetails.dataset.biayaPemeriksaan = biayaPemeriksaan;
    billingDetails.dataset.biayaObat = biayaObat;
    billingDetails.dataset.totalBayar = totalBayar;
    
    billingDetails.style.display = 'block';
}

// Process payment
function processPayment() {
    const billingDetails = document.getElementById('billingDetails');
    const patientId = billingDetails.dataset.patientId;
    
    if (!patientId) {
        alert('Pilih pasien terlebih dahulu');
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const totalBayar = parseInt(billingDetails.dataset.totalBayar);
    const biayaPemeriksaan = parseInt(billingDetails.dataset.biayaPemeriksaan);
    const biayaObat = parseInt(billingDetails.dataset.biayaObat);
    
    // Get patient data
    const savedQueue = localStorage.getItem('patientQueue');
    let patientName = 'Unknown';
    if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        const patient = queue.find(item => item.patient.id === patientId);
        if (patient) {
            patientName = patient.patient.nama;
        }
    }
    
    // Create payment record
    const payment = {
        id: 'PAY' + Date.now(),
        patientId: patientId,
        patientName: patientName,
        date: new Date().toISOString(),
        biayaPemeriksaan: biayaPemeriksaan,
        biayaObat: biayaObat,
        totalBayar: totalBayar,
        paymentMethod: paymentMethod,
        status: 'completed'
    };
    
    paymentHistory.push(payment);
    localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
    
    // Show receipt
    showReceipt(payment);
    
    alert('Pembayaran berhasil diproses!');
    resetBilling();
    displayPaymentHistory();
}

// Show receipt
function showReceipt(payment) {
    const modal = document.getElementById('receiptModal');
    const receiptBody = document.getElementById('receiptBody');
    
    receiptBody.innerHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h2>KLINIK SENTOSA</h2>
                <p>Jl. Kesehatan No. 123, Jakarta</p>
                <p>Telp: (021) 1234-5678</p>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-info">
                <div class="receipt-row">
                    <span>No. Struk:</span>
                    <span>${payment.id}</span>
                </div>
                <div class="receipt-row">
                    <span>Tanggal:</span>
                    <span>${new Date(payment.date).toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-row">
                    <span>Pasien:</span>
                    <span>${payment.patientName}</span>
                </div>
                <div class="receipt-row">
                    <span>ID Pasien:</span>
                    <span>${payment.patientId}</span>
                </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-items">
                <div class="receipt-item">
                    <span>Biaya Pemeriksaan</span>
                    <span>Rp ${payment.biayaPemeriksaan.toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-item">
                    <span>Biaya Obat</span>
                    <span>Rp ${payment.biayaObat.toLocaleString('id-ID')}</span>
                </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-total">
                <span><strong>TOTAL</strong></span>
                <span><strong>Rp ${payment.totalBayar.toLocaleString('id-ID')}</strong></span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-payment">
                <div class="receipt-row">
                    <span>Metode Pembayaran:</span>
                    <span>${getPaymentMethodText(payment.paymentMethod)}</span>
                </div>
            </div>
            <div class="receipt-footer">
                <p>Terima kasih atas kunjungan Anda</p>
                <p>Semoga lekas sembuh</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Print receipt
function printReceipt() {
    const billingDetails = document.getElementById('billingDetails');
    const patientId = billingDetails.dataset.patientId;
    
    if (!patientId) {
        alert('Pilih pasien terlebih dahulu');
        return;
    }
    
    // Get patient data
    const savedQueue = localStorage.getItem('patientQueue');
    let patientName = 'Unknown';
    if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        const patient = queue.find(item => item.patient.id === patientId);
        if (patient) {
            patientName = patient.patient.nama;
        }
    }
    
    const biayaPemeriksaan = parseInt(billingDetails.dataset.biayaPemeriksaan);
    const biayaObat = parseInt(billingDetails.dataset.biayaObat);
    const totalBayar = parseInt(billingDetails.dataset.totalBayar);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    const payment = {
        id: 'PAY' + Date.now(),
        patientId: patientId,
        patientName: patientName,
        date: new Date().toISOString(),
        biayaPemeriksaan: biayaPemeriksaan,
        biayaObat: biayaObat,
        totalBayar: totalBayar,
        paymentMethod: paymentMethod
    };
    
    showReceipt(payment);
}

// Close receipt modal
function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
}

// Get payment method text
function getPaymentMethodText(method) {
    const methods = {
        'cash': 'Tunai',
        'transfer': 'Transfer Bank',
        'card': 'Kartu Debit/Kredit'
    };
    return methods[method] || method;
}

// Reset billing
function resetBilling() {
    document.getElementById('billingPatientSelect').value = '';
    document.getElementById('billingDetails').style.display = 'none';
}

// Display payment history
function displayPaymentHistory() {
    const container = document.getElementById('paymentHistory');
    
    if (paymentHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>Belum ada riwayat pembayaran</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = paymentHistory.map(payment => `
        <div class="payment-card">
            <div class="payment-header">
                <div>
                    <h4>${payment.patientName}</h4>
                    <p class="payment-id">ID: ${payment.patientId} | No. Struk: ${payment.id}</p>
                    <p class="payment-date">${new Date(payment.date).toLocaleString('id-ID')}</p>
                </div>
                <div class="payment-status status-success">
                    Lunas
                </div>
            </div>
            <div class="payment-details">
                <div class="payment-detail-row">
                    <span>Biaya Pemeriksaan:</span>
                    <span>Rp ${payment.biayaPemeriksaan.toLocaleString('id-ID')}</span>
                </div>
                <div class="payment-detail-row">
                    <span>Biaya Obat:</span>
                    <span>Rp ${payment.biayaObat.toLocaleString('id-ID')}</span>
                </div>
                <div class="payment-detail-row total">
                    <span><strong>Total:</strong></span>
                    <span><strong>Rp ${payment.totalBayar.toLocaleString('id-ID')}</strong></span>
                </div>
                <div class="payment-detail-row">
                    <span>Metode:</span>
                    <span>${getPaymentMethodText(payment.paymentMethod)}</span>
                </div>
            </div>
            <div class="payment-actions">
                <button class="btn-action btn-select" onclick="viewReceipt('${payment.id}')">
                    <i class="fas fa-eye"></i> Lihat Struk
                </button>
            </div>
        </div>
    `).join('');
}

// View receipt from history
function viewReceipt(paymentId) {
    const payment = paymentHistory.find(p => p.id === paymentId);
    if (payment) {
        showReceipt(payment);
    }
}

// Refresh payment history
function refreshPaymentHistory() {
    loadBillingData();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadBillingData();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const receiptModal = document.getElementById('receiptModal');
        if (event.target === receiptModal) {
            closeReceiptModal();
        }
    };
});


