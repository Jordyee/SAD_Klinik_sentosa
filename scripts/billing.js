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
    
    displayPatientsForBilling();
    displayPaymentHistory();
}

// --- UI Population ---

function displayPatientsForBilling() {
    const container = document.getElementById('patientsForBillingList');
    if (!container) return;

    const patientsForBilling = getQueue().filter(p => p.status === 'Menunggu Pembayaran');
    
    container.innerHTML = ''; // Clear previous list

    if (patientsForBilling.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada pasien yang menunggu pembayaran.</p></div>`;
        return;
    }

    patientsForBilling.forEach(item => {
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-billing-card';
        patientCard.setAttribute('onclick', `loadBillingDetails('${item.patient.patientId}')`);
        patientCard.innerHTML = `
            <div class="patient-name">${item.patient.nama}</div>
            <div class="patient-id">ID: ${item.patient.patientId}</div>
            <div class="patient-queue-number">Antrian #${item.queueNumber}</div>
        `;
        container.appendChild(patientCard);
    });
}

function loadBillingDetails(patientId) {
    const billingDetails = document.getElementById('billingDetails');
    if (!patientId) {
        billingDetails.style.display = 'none';
        return;
    }

    // Highlight selected patient
    document.querySelectorAll('.patient-billing-card').forEach(card => card.classList.remove('active'));
    const selectedCard = document.querySelector(`.patient-billing-card[onclick*="'${patientId}'"]`);
    if (selectedCard) selectedCard.classList.add('active');

    const patient = findPatientById(patientId);
    if (!patient) {
        Swal.fire('Error', 'Data pasien tidak ditemukan.', 'error');
        return;
    }

    // --- Cost Calculation ---
    const biayaPemeriksaan = BIAYA_PEMERIKSAAN_DEFAULT;
    let biayaObat = 0;
    
    const prescriptions = JSON.parse(localStorage.getItem('pendingPrescriptions') || '[]');
    const patientPrescription = prescriptions.find(p => p.patientId === patientId && p.status === 'processed');
    
    if (patientPrescription) {
        const medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
        patientPrescription.items.forEach(item => {
            const medicine = medicines.find(m => m.id === item.medicineId);
            if (medicine) {
                biayaObat += medicine.harga * (item.quantity || 1); // Assume quantity is 1 if not specified
            }
        });
    }

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
    
    // Store final total for payment processing
    billingDetails.dataset.patientId = patientId;
    billingDetails.dataset.finalTotal = finalTotal;
    
    billingDetails.style.display = 'block';
}


// --- Payment Processing ---

function processPayment() {
    const billingDetails = document.getElementById('billingDetails');
    const patientId = billingDetails.dataset.patientId;
    
    if (!patientId) {
        Swal.fire('Peringatan', 'Pilih pasien dari daftar terlebih dahulu.', 'warning');
        return;
    }
    
    updateQueueStatus(patientId, 'Menunggu Pengambilan Obat');
    
    const finalTotal = parseInt(billingDetails.dataset.finalTotal);

    const payment = {
        id: 'PAY' + Date.now(),
        patientId: patientId,
        patientName: getPatientName(patientId),
        date: new Date().toISOString(),
        totalBayar: finalTotal,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        status: 'Lunas'
    };
    
    paymentHistory.push(payment);
    localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
    
    Swal.fire({
        title: 'Pembayaran Berhasil!',
        text: 'Pasien dapat melanjutkan untuk mengambil obat.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
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

// Other functions like showReceipt, closeReceiptModal can remain the same
function showReceipt(payment) {
    const modal = document.getElementById('receiptModal');
    const receiptBody = document.getElementById('receiptBody');
    if (!modal || !receiptBody) return;
    
    receiptBody.innerHTML = `...`; // Receipt generation logic
    modal.style.display = 'block';
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if(modal) modal.style.display = 'none';
}


