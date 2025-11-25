// Billing Module JavaScript (API Integration)

document.addEventListener('DOMContentLoaded', function () {
    if (!requireRole(['admin', 'pemilik'])) {
        return;
    }

    const role = getCurrentRole();
    if (role === 'pemilik') {
        // Owner only sees reports
        document.getElementById('paymentTab').style.display = 'none';
        document.querySelector('.tab-btn[data-tab="payment"]').style.display = 'none';
        document.querySelector('.tab-btn[data-tab="reports"]').click();
    } else {
        loadBillingData();
    }

    setupBillingListeners();
});

function loadBillingData() {
    displayPendingBills();
    // Pre-load reports for today
    generateReport();
}

function setupBillingListeners() {
    // Tab switching
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');

            if (tabName === 'payment') displayPendingBills();
            if (tabName === 'reports') generateReport();
        });
    });

    // Report filters
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateReport);
    }
}

// --- Payment Processing ---

async function getPendingBills() {
    try {
        const response = await fetch(`${API_BASE_URL}/billing/pending`);
        if (!response.ok) throw new Error('Failed to fetch bills');
        return await response.json();
    } catch (error) {
        console.error('Error fetching bills:', error);
        return [];
    }
}

async function displayPendingBills() {
    const container = document.getElementById('pendingBillsList');
    if (!container) return;

    const bills = await getPendingBills();

    if (bills.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Tidak ada tagihan yang menunggu pembayaran.</p></div>`;
        return;
    }

    container.innerHTML = bills.map(bill => `
        <div class="bill-card">
            <div class="bill-header">
                <h4>Tagihan: ${bill.patientName}</h4>
                <span class="status-badge status-billing">Menunggu Pembayaran</span>
            </div>
            <div class="bill-details">
                <p><strong>ID Kunjungan:</strong> ${bill.visitId}</p>
                <p><strong>Total:</strong> Rp ${bill.totalAmount.toLocaleString('id-ID')}</p>
                <ul class="bill-items">
                    ${bill.items.map(item => `
                        <li>${item.description}: Rp ${item.amount.toLocaleString('id-ID')}</li>
                    `).join('')}
                </ul>
            </div>
            <div class="bill-actions">
                <button class="btn-action btn-success" onclick="processPayment('${bill.visitId}')">
                    <i class="fas fa-money-bill-wave"></i> Bayar Sekarang
                </button>
            </div>
        </div>
    `).join('');
}

async function processPayment(visitId) {
    const bills = await getPendingBills();
    const bill = bills.find(b => b.visitId === visitId);
    if (!bill) return;

    const { value: paymentMethod } = await Swal.fire({
        title: 'Konfirmasi Pembayaran',
        html: `
            <p>Total Tagihan: <strong>Rp ${bill.totalAmount.toLocaleString('id-ID')}</strong></p>
            <p>Pilih metode pembayaran:</p>
        `,
        input: 'select',
        inputOptions: {
            'Cash': 'Tunai',
            'Debit': 'Debit Card',
            'QRIS': 'QRIS',
            'Transfer': 'Transfer Bank'
        },
        inputPlaceholder: 'Pilih metode...',
        showCancelButton: true,
        confirmButtonText: 'Bayar',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value) return 'Anda harus memilih metode pembayaran!'
        }
    });

    if (paymentMethod) {
        try {
            const response = await fetch(`${API_BASE_URL}/billing/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitId,
                    paymentMethod
                })
            });
            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    title: 'Pembayaran Berhasil!',
                    text: 'Transaksi telah dicatat dan struk siap dicetak.',
                    icon: 'success'
                });
                displayPendingBills();
            } else {
                Swal.fire('Gagal', result.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memproses pembayaran.', 'error');
        }
    }
}

// --- Reporting ---

async function generateReport() {
    const type = document.getElementById('reportType').value;
    const date = document.getElementById('reportDate').value;
    const container = document.getElementById('reportResults');

    if (!container) return;

    try {
        // Construct query params
        let query = `type=${type}`;
        if (date) query += `&date=${date}`;

        const response = await fetch(`${API_BASE_URL}/billing/reports?${query}`);
        const reportData = await response.json();

        if (reportData.transactions.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>Tidak ada data transaksi untuk periode ini.</p></div>`;
            return;
        }

        let html = `
            <div class="report-summary">
                <div class="summary-card">
                    <h5>Total Pendapatan</h5>
                    <h3>Rp ${reportData.summary.totalRevenue.toLocaleString('id-ID')}</h3>
                </div>
                <div class="summary-card">
                    <h5>Total Transaksi</h5>
                    <h3>${reportData.summary.transactionCount}</h3>
                </div>
            </div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>ID Transaksi</th>
                        <th>Metode</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        html += reportData.transactions.map(t => `
            <tr>
                <td>${new Date(t.timestamp).toLocaleTimeString('id-ID')}</td>
                <td>${t.id}</td>
                <td>${t.paymentMethod}</td>
                <td>Rp ${t.totalAmount.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        html += `</tbody></table>`;

        // Add Print Button
        html += `
            <div class="report-actions" style="margin-top: 20px; text-align: right;">
                <button class="btn-action btn-secondary" onclick="printReport()"><i class="fas fa-print"></i> Cetak Laporan</button>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error('Error generating report:', error);
        container.innerHTML = `<div class="empty-state"><p>Gagal memuat laporan.</p></div>`;
    }
}

function printReport() {
    window.print();
}
