// Billing Module - API Integration

// Expose functions globally for HTML onclick attributes
window.loadBillingPageData = loadBillingPageData;
window.resetBilling = resetBilling;
window.processPayment = processPayment;
window.loadBillingDetails = loadBillingDetails;

document.addEventListener('DOMContentLoaded', function () {
    // Check auth using existing auth.js function if available, otherwise manual check
    if (typeof requireRole === 'function') {
        if (!requireRole(['admin', 'kasir', 'apotek'])) {
            return;
        }
    }
    loadBillingPageData();
});

async function loadBillingPageData() {
    console.log('Loading billing page data...');
    await Promise.all([
        displayPendingBillings(),
        displayPaymentHistory()
    ]);
}

async function displayPendingBillings() {
    const container = document.getElementById('patientsForBillingList');
    if (!container) {
        console.error('patientsForBillingList container not found');
        return;
    }

    container.innerHTML = '<div class="loading-spinner">Memuat...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/billing/pending`);
        if (!response.ok) throw new Error('Failed to fetch billings');

        const billings = await response.json();
        console.log('Billings received:', billings);

        container.innerHTML = ''; // Clear loading

        if (billings.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Tidak ada pasien yang menunggu pembayaran.</p></div>';
            return;
        }

        container.innerHTML = billings.map(billing => `
            <div class="patient-billing-card" onclick="loadBillingDetails('${billing.visitId}')">
                <div class="patient-name">${billing.patientName}</div>
                <div class="patient-id">ID: ${billing.patientId}</div>
                <div class="patient-queue-number">Total: Rp ${billing.totalAmount.toLocaleString('id-ID')}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading billings:', error);
        container.innerHTML = '<div class="empty-state"><p>Gagal memuat data pembayaran.</p></div>';
    }
}

async function displayPaymentHistory() {
    const container = document.getElementById('paymentHistory');
    if (!container) return;

    try {
        // Use reports endpoint to get all transactions
        const response = await fetch(`${API_BASE_URL}/billing/reports`);
        if (!response.ok) throw new Error('Failed to fetch history');

        const data = await response.json();
        const transactions = data.transactions || [];

        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Belum ada riwayat pembayaran.</p></div>';
            return;
        }

        // Sort by timestamp descending (newest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        container.innerHTML = transactions.map(t => {
            return `
            <div class="payment-card">
                <div class="payment-header">
                    <strong>ID: ${t.visitId}</strong>
                    <span class="payment-date">${new Date(t.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <div class="payment-details">
                    <span>${t.items ? t.items.length : 0} Item</span>
                    <strong>Rp ${t.totalAmount.toLocaleString('id-ID')}</strong>
                </div>
                <div class="payment-footer">
                    <span class="payment-method">${t.paymentMethod}</span>
                    <span class="status-badge status-success">Lunas</span>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        container.innerHTML = '<div class="empty-state"><p>Gagal memuat riwayat.</p></div>';
    }
}

let currentBilling = null;

async function loadBillingDetails(visitId) {
    try {
        const response = await fetch(`${API_BASE_URL}/billing/pending`);
        const billings = await response.json();

        currentBilling = billings.find(b => b.visitId === visitId);
        if (!currentBilling) {
            Swal.fire('Error', 'Data billing tidak ditemukan', 'error');
            return;
        }

        // Highlight selected card
        document.querySelectorAll('.patient-billing-card').forEach(card => {
            card.classList.remove('active');
        });

        // Display billing details
        const detailsContainer = document.getElementById('billingDetails');
        if (detailsContainer) {
            detailsContainer.style.display = 'block';

            document.getElementById('biayaPemeriksaan').textContent = `Rp ${currentBilling.consultationFee.toLocaleString('id-ID')}`;
            document.getElementById('biayaObat').textContent = `Rp ${currentBilling.medicineCost.toLocaleString('id-ID')}`;
            document.getElementById('subTotal').innerHTML = `<strong>Rp ${currentBilling.totalAmount.toLocaleString('id-ID')}</strong>`;
            document.getElementById('patientStatus').textContent = 'Umum';
            document.getElementById('discount').textContent = 'Rp 0';
            document.getElementById('finalTotal').innerHTML = `<strong>Rp ${currentBilling.totalAmount.toLocaleString('id-ID')}</strong>`;
        }

    } catch (error) {
        console.error('Error loading billing details:', error);
        Swal.fire('Error', 'Gagal memuat detail pembayaran', 'error');
    }
}

function resetBilling() {
    const detailsContainer = document.getElementById('billingDetails');
    if (detailsContainer) {
        detailsContainer.style.display = 'none';
    }
    document.querySelectorAll('.patient-billing-card').forEach(card => {
        card.classList.remove('active');
    });
    currentBilling = null;
}

async function processPayment() {
    if (!currentBilling) {
        Swal.fire('Peringatan', 'Pilih pasien terlebih dahulu', 'warning');
        return;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
        Swal.fire('Peringatan', 'Pilih metode pembayaran', 'warning');
        return;
    }

    try {
        const transactionData = {
            visitId: currentBilling.visitId,
            totalAmount: currentBilling.totalAmount,
            items: [
                { description: 'Biaya Pemeriksaan', amount: currentBilling.consultationFee },
                { description: 'Biaya Obat', amount: currentBilling.medicineCost }
            ],
            paymentMethod: paymentMethod.value
        };

        const response = await fetch(`${API_BASE_URL}/billing/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                title: 'Pembayaran Berhasil!',
                text: `Total: Rp ${currentBilling.totalAmount.toLocaleString('id-ID')}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            resetBilling();
            loadBillingPageData();
        } else {
            Swal.fire('Gagal', result.message, 'error');
        }

    } catch (error) {
        console.error('Error processing payment:', error);
        Swal.fire('Error', 'Gagal memproses pembayaran', 'error');
    }
}
