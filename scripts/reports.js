// Reports Module JavaScript

// Tab switching
function switchReportTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'daily') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('dailyReportTab').classList.add('active');
        loadDailyReport();
    } else if (tab === 'monthly') {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('monthlyReportTab').classList.add('active');
        loadMonthlyReport();
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('patientsDataTab').classList.add('active');
        loadPatientsData();
    }
}

// Load dashboard stats
function loadDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Load payment history
    const savedPayments = localStorage.getItem('paymentHistory');
    let payments = [];
    if (savedPayments) {
        payments = JSON.parse(savedPayments);
    }
    
    // Filter today's payments
    const todayPayments = payments.filter(p => p.date.startsWith(today));
    
    // Calculate stats
    const totalPatients = new Set(todayPayments.map(p => p.patientId)).size;
    const totalRevenue = todayPayments.reduce((sum, p) => sum + (Number(p.totalBayar) || 0), 0);
    
    // Load prescriptions
    const savedPrescriptions = localStorage.getItem('processedPrescriptions');
    let prescriptions = [];
    if (savedPrescriptions) {
        prescriptions = JSON.parse(savedPrescriptions);
    }
    const todayPrescriptions = prescriptions.filter(p => p.date && p.date.startsWith(today));
    
    // Load examinations
    const savedRecords = localStorage.getItem('medicalRecords');
    let examinations = [];
    if (savedRecords) {
        examinations = JSON.parse(savedRecords);
    }
    const todayExaminations = examinations.filter(e => e.date && e.date.startsWith(today));
    
    // Update dashboard
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalRevenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
    document.getElementById('totalPrescriptions').textContent = todayPrescriptions.length;
    document.getElementById('totalExaminations').textContent = todayExaminations.length;
}

// Load daily report
function loadDailyReport() {
    let date = document.getElementById('dailyReportDate').value;
    if (!date) date = new Date().toISOString().split('T')[0];
    const container = document.getElementById('dailyReportContent');
    
    // Load data
    const savedPayments = localStorage.getItem('paymentHistory');
    let payments = [];
    if (savedPayments) {
        payments = JSON.parse(savedPayments);
    }
    
    const dayPayments = payments.filter(p => p.date.startsWith(date));
    
    const totalPatients = new Set(dayPayments.map(p => p.patientId)).size;
    const totalRevenue = dayPayments.reduce((sum, p) => sum + (Number(p.totalBayar) || 0), 0);
    const totalExaminations = dayPayments.length;
    const totalBiayaPemeriksaan = dayPayments.reduce((sum, p) => sum + (Number(p.biayaPemeriksaan) || 0), 0);
    const totalBiayaObat = dayPayments.reduce((sum, p) => sum + (Number(p.biayaObat) || 0), 0);
    
    container.innerHTML = `
        <div class="report-summary">
            <h3>Ringkasan Laporan Harian - ${new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Pasien</span>
                    <span class="summary-value">${totalPatients}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Pemeriksaan</span>
                    <span class="summary-value">${totalExaminations}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Pendapatan</span>
                    <span class="summary-value">Rp ${totalRevenue.toLocaleString('id-ID')}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Biaya Pemeriksaan</span>
                    <span class="summary-value">Rp ${totalBiayaPemeriksaan.toLocaleString('id-ID')}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Biaya Obat</span>
                    <span class="summary-value">Rp ${totalBiayaObat.toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>
        <div class="report-details">
            <h4>Detail Transaksi</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>No. Struk</th>
                        <th>Pasien</th>
                        <th>Biaya Pemeriksaan</th>
                        <th>Biaya Obat</th>
                        <th>Total</th>
                        <th>Metode</th>
                    </tr>
                </thead>
                <tbody>
                    ${dayPayments.length === 0 ? `
                    <tr>
                        <td colspan="6" class="empty-state-cell">
                            <div class="empty-state">
                                <i class="fas fa-calendar-day"></i>
                                <p>Tidak ada transaksi pada tanggal ini</p>
                            </div>
                        </td>
                    </tr>
                    ` : dayPayments.map(payment => `
                    <tr>
                        <td>${payment.id}</td>
                        <td>${payment.patientName}</td>
                        <td>Rp ${payment.biayaPemeriksaan.toLocaleString('id-ID')}</td>
                        <td>Rp ${payment.biayaObat.toLocaleString('id-ID')}</td>
                        <td><strong>Rp ${payment.totalBayar.toLocaleString('id-ID')}</strong></td>
                        <td>${getPaymentMethodText(payment.paymentMethod)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load monthly report
function loadMonthlyReport() {
    let month = document.getElementById('monthlyReportMonth').value;
    if (!month) month = new Date().toISOString().slice(0,7); // YYYY-MM
    const container = document.getElementById('monthlyReportContent');
    
    // Load data
    const savedPayments = localStorage.getItem('paymentHistory');
    let payments = [];
    if (savedPayments) {
        payments = JSON.parse(savedPayments);
    }
    
    const monthPayments = payments.filter(p => p.date.startsWith(month));

    const totalPatients = new Set(monthPayments.map(p => p.patientId)).size;
    const totalRevenue = monthPayments.reduce((sum, p) => sum + (Number(p.totalBayar) || 0), 0);
    const totalExaminations = monthPayments.length;
    const totalBiayaPemeriksaan = monthPayments.reduce((sum, p) => sum + (Number(p.biayaPemeriksaan) || 0), 0);
    const totalBiayaObat = monthPayments.reduce((sum, p) => sum + (Number(p.biayaObat) || 0), 0);
    
    // Group by day
    const dailyData = {};
    monthPayments.forEach(payment => {
        const day = payment.date.split('T')[0];
        if (!dailyData[day]) {
            dailyData[day] = { count: 0, revenue: 0 };
        }
        dailyData[day].count++;
        dailyData[day].revenue += payment.totalBayar;
    });
    
    container.innerHTML = `
        <div class="report-summary">
            <h3>Ringkasan Laporan Bulanan - ${new Date(month + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Pasien</span>
                    <span class="summary-value">${totalPatients}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Pemeriksaan</span>
                    <span class="summary-value">${totalExaminations}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Pendapatan</span>
                    <span class="summary-value">Rp ${totalRevenue.toLocaleString('id-ID')}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Biaya Pemeriksaan</span>
                    <span class="summary-value">Rp ${totalBiayaPemeriksaan.toLocaleString('id-ID')}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Biaya Obat</span>
                    <span class="summary-value">Rp ${totalBiayaObat.toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>
        <div class="report-details">
            <h4>Pendapatan Harian</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Jumlah Transaksi</th>
                        <th>Total Pendapatan</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(dailyData).length === 0 ? `
                    <tr>
                        <td colspan="3" class="empty-state-cell">
                            <div class="empty-state">
                                <i class="fas fa-calendar-alt"></i>
                                <p>Tidak ada transaksi pada bulan ini</p>
                            </div>
                        </td>
                    </tr>
                    ` : Object.entries(dailyData).sort().map(([day, data]) => `
                    <tr>
                        <td>${new Date(day).toLocaleDateString('id-ID')}</td>
                        <td>${data.count}</td>
                        <td><strong>Rp ${data.revenue.toLocaleString('id-ID')}</strong></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load patients data
function loadPatientsData() {
    const container = document.getElementById('patientsDataContent');
    
    // Load patient data
    const savedQueue = localStorage.getItem('patientQueue');
    let patients = [];
    if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        patients = queue.map(item => item.patient);
    }

    // Remove duplicates
    const uniquePatients = [];
    const seen = new Set();
    patients.forEach(patient => {
        const pid = patient.patientId || patient.id || '';
        if (!seen.has(pid)) {
            seen.add(pid);
            uniquePatients.push(patient);
        }
    });
    
    if (uniquePatients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <p>Belum ada data pasien</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>ID Pasien</th>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>No. Telepon</th>
                    <th>Kunjungan Terakhir</th>
                </tr>
            </thead>
            <tbody id="patientsTableBody">
                ${uniquePatients.map(patient => `
                <tr>
                    <td>${patient.id}</td>
                    <td><strong>${patient.nama}</strong></td>
                    <td>${patient.alamat || '-'}</td>
                    <td>${patient.no_telp || '-'}</td>
                    <td>${patient.lastVisit || '-'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Search patient data
function searchPatientData(query) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    const searchTerm = query.toLowerCase();
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
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

// Export daily report (placeholder)
function exportDailyReport() {
    alert('Fitur export PDF akan diimplementasikan dengan library seperti jsPDF');
}

// Export monthly report (placeholder)
function exportMonthlyReport() {
    alert('Fitur export PDF akan diimplementasikan dengan library seperti jsPDF');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadDailyReport();
});


