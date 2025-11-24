document.addEventListener('DOMContentLoaded', function() {
    requireRole(['admin', 'pasien']); // Allow patients to see their bills
    loadBillingPageData();
});

function loadBillingPageData() {
    const savedPayments = localStorage.getItem('paymentHistory');
    if (savedPayments) {
        paymentHistory = JSON.parse(savedPayments);
    }
    
    displayPrescriptionsForBilling();
    displayPaymentHistory();
}

// --- UI Population ---

function displayPrescriptionsForBilling() {
    const container = document.getElementById('patientsForBillingList');
    if (!container) return;

    const allPrescriptions = getPrescriptions();
    const prescriptionsForBilling = allPrescriptions.filter(p => 
        p.status === 'processed' && p.paymentStatus === 'unpaid'
    );
    
    // Ensure a search input exists for filtering patient cards
    let searchInput = document.getElementById('billingPatientSearch');
    if (!searchInput) {
        searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.id = 'billingPatientSearch';
        searchInput.placeholder = 'Cari pasien (nama atau ID)...';
        searchInput.className = 'searchable-select-input';
        container.parentNode.insertBefore(searchInput, container);

        // Debounced filter
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
        patientCard.dataset.patientId = patient.patientId; // Add data attribute for easy selection
        patientCard.innerHTML = `
            <div class="patient-name">${patient.patientName}</div>
            <div class="patient-id">Pasien ID: ${patient.patientId}</div>
            <div class="patient-queue-number">Resep: ${patient.prescriptions.length} item</div>
        `;
        
        // Use addEventListener for a more robust click handling
        patientCard.addEventListener('click', () => {
            loadBillingDetails(patient.patientId);
        });

        container.appendChild(patientCard);
    });
}

function loadBillingDetails(patientId) {
    const billingDetails = document.getElementById('billingDetails');
    if (!patientId) {
        billingDetails.style.display = 'none';
        return;
    }

    // Highlight selected patient card using the data attribute
    document.querySelectorAll('.patient-billing-card').forEach(card => card.classList.remove('active'));
    const selectedCard = document.querySelector(`.patient-billing-card[data-patient-id='${patientId}']`);
    if (selectedCard) selectedCard.classList.add('active');

    const patient = findPatientById(patientId);
    if (!patient) {
        Swal.fire('Error', 'Data pasien tidak ditemukan.', 'error');
        return;
    }

    // Get all unpaid prescriptions for this patient
    const patientPrescriptions = getPrescriptions().filter(p => 
        p.patientId === patientId && p.status === 'processed' && p.paymentStatus === 'unpaid'
    );

    if (patientPrescriptions.length === 0) {
        Swal.fire('Info', 'Pasien ini tidak memiliki resep yang perlu dibayar.', 'info');
        resetBilling();
        return;
    }

    // --- Cost Calculation (Consolidated) ---
    const biayaPemeriksaan = BIAYA_PEMERIKSAAN_DEFAULT; // Charge examination fee once per payment session
    let biayaObat = 0;
    const medicines = getMedicines();
    
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
    
    // Store patient ID, all relevant prescription IDs, and final total
    const prescriptionIds = patientPrescriptions.map(p => p.id);
    billingDetails.dataset.prescriptionIds = JSON.stringify(prescriptionIds); // Store as JSON string
    billingDetails.dataset.patientId = patientId;
    billingDetails.dataset.finalTotal = finalTotal;
    billingDetails.dataset.biayaPemeriksaan = biayaPemeriksaan;
    billingDetails.dataset.biayaObat = biayaObat;
    
    billingDetails.style.display = 'block';
}


// --- Payment Processing ---

function processPayment() {
    const billingDetails = document.getElementById('billingDetails');
    const patientId = billingDetails.dataset.patientId;
    const prescriptionIdsStr = billingDetails.dataset.prescriptionIds;
    
    if (!patientId || !prescriptionIdsStr) {
        Swal.fire('Peringatan', 'Pilih pasien dari daftar terlebih dahulu.', 'warning');
        return;
    }
    
    const prescriptionIds = JSON.parse(prescriptionIdsStr);
    let allPrescriptions = getPrescriptions();

    // Update payment status for all prescriptions in this transaction
    let updatedCount = 0;
    prescriptionIds.forEach(id => {
        const index = allPrescriptions.findIndex(p => p.id === id);
        if (index !== -1) {
            allPrescriptions[index].paymentStatus = 'paid';
            updatedCount++;
        }
    });

    if (updatedCount === 0) {
        Swal.fire('Error', 'Tidak ada resep yang ditemukan untuk diproses.', 'error');
        return;
    }

    savePrescriptions(allPrescriptions);
    
    const finalTotal = Number(billingDetails.dataset.finalTotal) || 0;
    const biayaPemeriksaanPaid = Number(billingDetails.dataset.biayaPemeriksaan) || 0;
    const biayaObatPaid = Number(billingDetails.dataset.biayaObat) || 0;

    const payment = {
        id: 'PAY' + Date.now(),
        prescriptionIds: prescriptionIds, // Store all paid prescription IDs
        patientId: patientId,
        patientName: getPatientName(patientId),
        date: new Date().toISOString(),
        totalBayar: finalTotal,
        biayaPemeriksaan: biayaPemeriksaanPaid,
        biayaObat: biayaObatPaid,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        status: 'Lunas'
    };
    
    paymentHistory.push(payment);
    localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
    
    // Update queue status for the patient
    updateQueueStatus(patientId, 'Menunggu Pengambilan Obat');

    Swal.fire({
        title: 'Pembayaran Berhasil!',
        text: `Pembayaran untuk ${updatedCount} resep telah berhasil. Pasien dapat melanjutkan untuk mengambil obat.`,
        icon: 'success',
        timer: 2500,
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

    // Handle multiple prescription IDs
    const prescriptionIdText = (payment.prescriptionIds || [payment.prescriptionId]).join(', ');

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






