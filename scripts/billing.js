// ======================================================================
// BILLING MODULE - FIREBASE VERSION
// ======================================================================
// Payment data now saved to Firebase Firestore

const BIAYA_PEMERIKSAAN_DEFAULT = 50000;
let paymentHistory = []; // Keep for local caching

document.addEventListener('DOMContentLoaded', async function () {
    requireRole(['admin', 'pasien']);
    await loadBillingPageData();
});

async function loadBillingPageData() {
    await displayPrescriptionsForBilling();
    await displayPaymentHistory();
}

// --- UI Population ---

async function displayPrescriptionsForBilling() {
    const container = document.getElementById('patientsForBillingList');
    if (!container) return;

    const allPrescriptions = await getPrescriptions();
    const prescriptionsForBilling = allPrescriptions.filter(p =>
        p.status === 'processed' && p.paymentStatus === 'unpaid'
    );

    // Search input
    let searchInput = document.getElementById('billingPatientSearch');
    if (!searchInput) {
        searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.id = 'billingPatientSearch';
        searchInput.placeholder = 'Cari pasien (nama atau ID)...';
        searchInput.className = 'searchable-select-input';
        container.parentNode.insertBefore(searchInput, container);

        let t;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(t);
            const q = e.target.value.trim().toLowerCase();
            t = setTimeout(() => {
                document.querySelectorAll('.patient-billing-card').forEach(card => {
                    const txt = (card.textContent || '').toLowerCase();
                    card.style.display = q === '' || txt.includes(q) ? '' : 'none';
                });
            }, 160);
        });
    }

    container.innerHTML = '';

    if (prescriptionsForBilling.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada resep yang menunggu pembayaran.</p></div>`;
        return;
    }

    const patientsToBill = prescriptionsForBilling.reduce((acc, p) => {
        if (!acc[p.patientId]) {
            acc[p.patientId] = {
                patientId: p.patientId,
                patientName: p.patientName,
                prescriptions: []
            };
        }
        acc[p.patientId].prescriptions.push(p);
        return acc;
    }, {});

    Object.values(patientsToBill).forEach(patient => {
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-billing-card';
        patientCard.dataset.patientId = patient.patientId;
        patientCard.innerHTML = `
            <div class="patient-name">${patient.patientName}</div>
            <div class="patient-id">Pasien ID: ${patient.patientId}</div>
            <div class="patient-queue-number">Resep: ${patient.prescriptions.length} item</div>
        `;

        patientCard.addEventListener('click', () => {
            loadBillingDetails(patient.patientId);
        });

        container.appendChild(patientCard);
    });
}

async function loadBillingDetails(patientId) {
    const billingDetails = document.getElementById('billingDetails');
    if (!patientId) {
        billingDetails.style.display = 'none';
        return;
    }

    document.querySelectorAll('.patient-billing-card').forEach(card => card.classList.remove('active'));
    const selectedCard = document.querySelector(`.patient-billing-card[data-patient-id='${patientId}']`);
    if (selectedCard) selectedCard.classList.add('active');

    const patient = await findPatientById(patientId);
    if (!patient) {
        Swal.fire('Error', 'Data pasien tidak ditemukan.', 'error');
        return;
    }

    const allPrescriptions = await getPrescriptions();
    const patientPrescriptions = allPrescriptions.filter(p =>
        p.patientId === patientId && p.status === 'processed' && p.paymentStatus === 'unpaid'
    );

    if (patientPrescriptions.length === 0) {
        Swal.fire('Info', 'Pasien ini tidak memiliki resep yang perlu dibayar.', 'info');
        resetBilling();
        return;
    }

    // Cost Calculation
    const biayaPemeriksaan = BIAYA_PEMERIKSAAN_DEFAULT;
    let biayaObat = 0;
    const medicines = await getMedicines();

    patientPrescriptions.forEach(prescription => {
        prescription.items.forEach(item => {
            const medicine = medicines.find(m => m.id === item.medicineId);
            if (medicine) {
                biayaObat += medicine.harga * (item.quantity || 1);
            }
        });
    });

    const subTotal = biayaPemeriksaan + biayaObat;
    let discount = 0;
    const patientStatus = patient.status_pasien || 'umum';

    // Discount Logic
    switch (patientStatus) {
        case 'bpjs':
            discount = subTotal; // 100%
            break;
        case 'asuransi':
            discount = subTotal * 0.8; // 80%
            break;
        case 'umum':
        default:
            discount = 0;
            break;
    }

    const finalTotal = subTotal - discount;

    // Update UI
    document.getElementById('biayaPemeriksaan').textContent = `Rp ${biayaPemeriksaan.toLocaleString('id-ID')}`;
    document.getElementById('biayaObat').textContent = `Rp ${biayaObat.toLocaleString('id-ID')}`;
    document.getElementById('subTotal').innerHTML = `<strong>Rp ${subTotal.toLocaleString('id-ID')}</strong>`;

    const statusEl = document.getElementById('patientStatus');
    statusEl.textContent = patientStatus.charAt(0).toUpperCase() + patientStatus.slice(1);
    statusEl.className = `status-badge status-${patientStatus}`;

    document.getElementById('discount').textContent = `- Rp ${discount.toLocaleString('id-ID')}`;
    document.getElementById('finalTotal').innerHTML = `<strong>Rp ${finalTotal.toLocaleString('id-ID')}</strong>`;

    const prescriptionIds = patientPrescriptions.map(p => p.id);
    billingDetails.dataset.prescriptionIds = JSON.stringify(prescriptionIds);
    billingDetails.dataset.patientId = patientId;
    billingDetails.dataset.patientName = patient.nama;
    billingDetails.dataset.finalTotal = finalTotal;
    billingDetails.dataset.biayaPemeriksaan = biayaPemeriksaan;
    billingDetails.dataset.biayaObat = biayaObat;

    billingDetails.style.display = 'block';
}

// --- Payment Processing (FIREBASE) ---

async function processPayment() {
    const billingDetails = document.getElementById('billingDetails');
    const patientId = billingDetails.dataset.patientId;
    const prescriptionIdsStr = billingDetails.dataset.prescriptionIds;

    if (!patientId || !prescriptionIdsStr) {
        Swal.fire('Peringatan', 'Pilih pasien dari daftar terlebih dahulu.', 'warning');
        return;
    }

    const prescriptionIds = JSON.parse(prescriptionIdsStr);

    // Update prescription payment status in Firebase
    const updatePromises = prescriptionIds.map(id =>
        firebaseDB.collection('prescriptions').doc(id).update({
            paymentStatus: 'paid',
            updatedAt: new Date()
        })
    );

    await Promise.all(updatePromises);

    const finalTotal = Number(billingDetails.dataset.finalTotal) || 0;
    const biayaPemeriksaanPaid = Number(billingDetails.dataset.biayaPemeriksaan) || 0;
    const biayaObatPaid = Number(billingDetails.dataset.biayaObat) || 0;
    const patientName = billingDetails.dataset.patientName;

    // Save payment to Firebase
    const paymentData = {
        prescriptionIds: prescriptionIds,
        patientId: patientId,
        patientName: patientName,
        totalBayar: finalTotal,
        biayaPemeriksaan: biayaPemeriksaanPaid,
        biayaObat: biayaObatPaid,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        status: 'Lunas',
        date: new Date(),
        createdBy: getCurrentUser().username,
        createdAt: new Date()
    };

    const paymentRef = await firebaseDB.collection('payments').add(paymentData);

    // Update queue status
    const queue = await getQueue();
    const appointment = queue.find(q => q.patientId === patientId);
    if (appointment) {
        await updateQueueStatus(appointment.id, 'Menunggu Pengambilan Obat');
    }

    Swal.fire({
        title: 'Pembayaran Berhasil!',
        text: `Pembayaran untuk ${prescriptionIds.length} resep telah berhasil. Pasien dapat melanjutkan untuk mengambil obat.`,
        icon: 'success',
        timer: 2500,
        showConfirmButton: false
    }).then(() => {
        showReceipt({ id: paymentRef.id, ...paymentData });
    });

    resetBilling();
    await loadBillingPageData();
}

// --- UI Helpers ---

function resetBilling() {
    document.getElementById('billingDetails').style.display = 'none';
    document.querySelectorAll('.patient-billing-card').forEach(card => card.classList.remove('active'));
}

async function displayPaymentHistory() {
    const container = document.getElementById('paymentHistory');
    if (!container) return;

    // Get payments from Firebase
    const paymentsSnapshot = await firebaseDB.collection('payments')
        .orderBy('date', 'desc')
        .limit(50)
        .get();

    if (paymentsSnapshot.empty) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada riwayat pembayaran.</p></div>`;
        return;
    }

    const payments = [];
    paymentsSnapshot.forEach(doc => {
        payments.push({ id: doc.id, ...doc.data() });
    });

    container.innerHTML = payments.map(payment => `
        <div class="payment-card">
            <p><strong>${payment.patientName}</strong> (ID: ${payment.patientId})</p>
            <p>Total: Rp ${payment.totalBayar.toLocaleString('id-ID')}</p>
            <p>Tanggal: ${payment.date.toDate().toLocaleString('id-ID')}</p>
            <p>Status: <span class="status-badge status-success">${payment.status}</span></p>
        </div>
    `).join('');
}

function showReceipt(payment) {
    const modal = document.getElementById('receiptModal');
    const receiptBody = document.getElementById('receiptBody');
    if (!modal || !receiptBody) return;

    modal.dataset.payment = JSON.stringify(payment);

    const prescriptionIdText = (payment.prescriptionIds || []).join(', ');
    const paymentDate = payment.date instanceof Date ? payment.date : payment.date.toDate();

    receiptBody.innerHTML = `
        <div class="receipt-header">
            <h3>Klinik Sentosa</h3>
            <p>Jl. Contoh No. 123, Kota Contoh</p>
            <p>Telp: (021) 12345678</p>
            <hr>
        </div>
        <div class="receipt-details">
            <p><strong>Tanggal:</strong> ${paymentDate.toLocaleString('id-ID')}</p>
            <p><strong>Pasien:</strong> ${payment.patientName} (ID: ${payment.patientId})</p>
            <p><strong>ID Resep:</strong> ${prescriptionIdText}</p>
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
    if (modal) modal.style.display = 'none';
}

function printReceipt() {
    const modal = document.getElementById('receiptModal');
    if (!modal || !modal.dataset.payment) {
        Swal.fire('Error', 'Tidak ada struk untuk dicetak.', 'error');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Struk Pembayaran</title>');
    printWindow.document.write('<link rel="stylesheet" href="../styles/main.css">');
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

console.log('✅ Billing.js (Firebase) loaded successfully!');
