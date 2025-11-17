// Billing Module JavaScript

let paymentHistory = [];
const BIAYA_PEMERIKSAAN_DEFAULT = 75000; // Default examination fee

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    requireRole(['admin']); // Billing is an admin-only feature now
    loadBillingPageData();
});

function loadBillingPageData() {
    const savedPayments = localStorage.getItem('paymentHistory');
    if (savedPayments) {
        paymentHistory = JSON.parse(savedPayments);
    }
    
    displayPrescriptionsForBilling(); // Changed to display prescriptions
    displayPaymentHistory();
}

// --- UI Population ---

function displayPrescriptionsForBilling() {
    const container = document.getElementById('patientsForBillingList');
    if (!container) return;

    // Get prescriptions that are processed but unpaid
    const prescriptionsForBilling = getPrescriptions().filter(p => 
        p.status === 'processed' && p.paymentStatus === 'unpaid'
    );
    
    container.innerHTML = ''; // Clear previous list

    if (prescriptionsForBilling.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada resep yang menunggu pembayaran.</p></div>`;
        return;
    }

    prescriptionsForBilling.forEach(p => {
        const prescriptionCard = document.createElement('div');
        prescriptionCard.className = 'patient-billing-card';
        prescriptionCard.setAttribute('onclick', `loadBillingDetails('${p.id}')`); // Pass prescription ID
        prescriptionCard.innerHTML = `
            <div class="patient-name">${p.patientName}</div>
            <div class="patient-id">Resep ID: ${p.id}</div>
            <div class="patient-queue-number">Pasien ID: ${p.patientId}</div>
        `;
        container.appendChild(prescriptionCard);
    });
}

function loadBillingDetails(prescriptionId) {
    const billingDetails = document.getElementById('billingDetails');
    if (!prescriptionId) {
        billingDetails.style.display = 'none';
        return;
    }

    // Highlight selected prescription
    document.querySelectorAll('.patient-billing-card').forEach(card => card.classList.remove('active'));
    const selectedCard = document.querySelector(`.patient-billing-card[onclick*="'${prescriptionId}'"]`);
    if (selectedCard) selectedCard.classList.add('active');

    const prescription = getPrescriptions().find(p => p.id === prescriptionId);
    if (!prescription) {
        Swal.fire('Error', 'Data resep tidak ditemukan.', 'error');
        return;
    }

    const patient = findPatientById(prescription.patientId);
    if (!patient) {
        Swal.fire('Error', 'Data pasien untuk resep ini tidak ditemukan.', 'error');
        return;
    }

    // --- Cost Calculation ---
    const biayaPemeriksaan = BIAYA_PEMERIKSAAN_DEFAULT; // Assume examination fee is per consultation/prescription
    let biayaObat = 0;
    
    const medicines = getMedicines(); // Assuming getMedicines is available globally or imported
    prescription.items.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medicineId);
        if (medicine) {
            biayaObat += medicine.harga * (item.quantity || 1);
        }
    });

    const subTotal = biayaPemeriksaan + biayaObat;
    let discount = 0;
    const patientStatus = patient.status_pasien || 'umum';

    // --- Discount Logic ---
    switch (patientStatus) {
        case 'bpjs':
            discount = subTotal; // 100% discount
            break;
        case 'asuransi':
            discount = subTotal * 0.8; // 80% discount
            break;
        case 'umum':
        default:
            discount = 0; // No discount
            break;
    }

    const finalTotal = subTotal - discount;

    // --- Update UI ---
    document.getElementById('biayaPemeriksaan').textContent = `Rp ${biayaPemeriksaan.toLocaleString('id-ID')}`;
    document.getElementById('biayaObat').textContent = `Rp ${biayaObat.toLocaleString('id-ID')}`;
    document.getElementById('subTotal').innerHTML = `<strong>Rp ${subTotal.toLocaleString('id-ID')}</strong>`;
    
    const statusEl = document.getElementById('patientStatus');
    statusEl.textContent = patientStatus.charAt(0).toUpperCase() + patientStatus.slice(1);
    statusEl.className = `status-badge status-${patientStatus}`;

    document.getElementById('discount').textContent = `- Rp ${discount.toLocaleString('id-ID')}`;
    document.getElementById('finalTotal').innerHTML = `<strong>Rp ${finalTotal.toLocaleString('id-ID')}</strong>`;
    
    // Store prescription ID and final total for payment processing
    billingDetails.dataset.prescriptionId = prescriptionId;
    billingDetails.dataset.patientId = patient.id; // Store patient ID for queue update logic
    billingDetails.dataset.finalTotal = finalTotal;
    
    billingDetails.style.display = 'block';
}


// --- Payment Processing ---

function processPayment() {
    const billingDetails = document.getElementById('billingDetails');
    const prescriptionId = billingDetails.dataset.prescriptionId;
    const patientId = billingDetails.dataset.patientId;
    
    if (!prescriptionId) {
        Swal.fire('Peringatan', 'Pilih resep dari daftar terlebih dahulu.', 'warning');
        return;
    }
    
    let prescriptions = getPrescriptions();
    const prescriptionIndex = prescriptions.findIndex(p => p.id === prescriptionId);

    if (prescriptionIndex === -1) {
        Swal.fire('Error', 'Resep tidak ditemukan.', 'error');
        return;
    }

    // Update prescription payment status
    prescriptions[prescriptionIndex].paymentStatus = 'paid';
    savePrescriptions(prescriptions);
    
    const finalTotal = parseInt(billingDetails.dataset.finalTotal);

    const payment = {
        id: 'PAY' + Date.now(),
        prescriptionId: prescriptionId,
        patientId: patientId,
        patientName: getPatientName(patientId),
        date: new Date().toISOString(),
        totalBayar: finalTotal,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        status: 'Lunas'
    };
    
    paymentHistory.push(payment);
    localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
    
    // Check if all prescriptions for this patient are now paid or completed
    const patientPrescriptions = getPrescriptions().filter(p => p.patientId === patientId);
    const allPaidOrCompleted = patientPrescriptions.every(p => p.paymentStatus === 'paid' || p.status === 'completed');

    if (allPaidOrCompleted) {
        updateQueueStatus(patientId, 'Menunggu Pengambilan Obat');
    } else {
        // If not all paid, patient might have other unpaid prescriptions, so keep status as 'Menunggu Pembayaran'
        // Or, if this is the first payment, update to 'Menunggu Pengambilan Obat'
        const currentQueueStatus = getQueue().find(q => q.patient.patientId === patientId)?.status;
        if (currentQueueStatus === 'Menunggu Pembayaran') {
             updateQueueStatus(patientId, 'Menunggu Pengambilan Obat');
        }
    }

    Swal.fire({
        title: 'Pembayaran Berhasil!',
        text: 'Pasien dapat melanjutkan untuk mengambil obat.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    }).then(() => {
        showReceipt(payment); // Show receipt after successful payment
    });
    
    resetBilling();
    loadBillingPageData(); // Refresh lists
}


// --- UI Helpers ---

function resetBilling() {
    document.getElementById('billingDetails').style.display = 'none';
    document.querySelectorAll('.patient-billing-card').forEach(card => card.classList.remove('active'));
}

function displayPaymentHistory() {
    const container = document.getElementById('paymentHistory');
    if (!container) return;

    if (paymentHistory.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada riwayat pembayaran.</p></div>`;
        return;
    }
    
    container.innerHTML = paymentHistory.slice().reverse().map(payment => `
        <div class="payment-card">
            <p><strong>${payment.patientName}</strong> (ID: ${payment.patientId})</p>
            <p>Total: Rp ${payment.totalBayar.toLocaleString('id-ID')}</p>
            <p>Status: <span class="status-badge status-success">${payment.status}</span></p>
        </div>
    `).join('');
}

function showReceipt(payment) {
    const modal = document.getElementById('receiptModal');
    const receiptBody = document.getElementById('receiptBody');
    if (!modal || !receiptBody) return;
    
    // Store payment data on modal for printing
    modal.dataset.payment = JSON.stringify(payment);

    receiptBody.innerHTML = `
        <div class="receipt-header">
            <h3>Klinik Sentosa</h3>
            <p>Jl. Contoh No. 123, Kota Contoh</p>
            <p>Telp: (021) 12345678</p>
            <hr>
        </div>
        <div class="receipt-details">
            <p><strong>Tanggal:</strong> ${new Date(payment.date).toLocaleString('id-ID')}</p>
            <p><strong>Pasien:</strong> ${payment.patientName} (ID: ${payment.patientId})</p>
            <p><strong>Resep ID:</strong> ${payment.prescriptionId}</p>
            <p><strong>Metode Pembayaran:</strong> ${payment.paymentMethod.toUpperCase()}</p>
            <hr>
            <p><strong>Total Pembayaran:</strong> <span class="total-amount">Rp ${payment.totalBayar.toLocaleString('id-ID')}</span></p>
        </div>
        <div class="receipt-footer">
            <p>Terima kasih atas kunjungan Anda.</p>
        </div>
    `;
    modal.style.display = 'block';
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if(modal) modal.style.display = 'none';
}

function printReceipt() {
    const modal = document.getElementById('receiptModal');
    if (!modal || !modal.dataset.payment) {
        Swal.fire('Error', 'Tidak ada struk untuk dicetak.', 'error');
        return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Struk Pembayaran</title>');
    printWindow.document.write('<link rel="stylesheet" href="../styles/main.css">'); // Include main CSS for basic styling
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: 'Inter', sans-serif; margin: 20px; }
        .receipt-content { width: 300px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; }
        .receipt-header, .receipt-details, .receipt-footer { text-align: center; margin-bottom: 10px; }
        .receipt-header h3 { margin-bottom: 5px; }
        .receipt-header p, .receipt-details p, .receipt-footer p { font-size: 0.9em; margin: 2px 0; }
        .total-amount { font-weight: bold; font-size: 1.2em; }
        hr { border: 0; border-top: 1px dashed #ccc; margin: 10px 0; }
        @media print {
            .modal-footer, .modal-header button { display: none; }
            .receipt-content { border: none; box-shadow: none; }
        }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(modal.querySelector('.modal-content').innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}


