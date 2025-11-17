# Klinik Sentosa - Sistem Informasi Klinik

Sistem informasi terkomputerisasi untuk mengelola alur pelayanan pasien di Klinik Sentosa, mulai dari pendaftaran hingga pembayaran.

## 🎨 Desain

Website ini menggunakan desain modern yang terinspirasi dari platform kesehatan Sunrise, dengan:
- **Color Scheme**: Blue & White theme yang profesional
- **UI/UX**: Clean, modern, dan user-friendly
- **Responsive**: Dapat diakses dari berbagai perangkat

## 📁 Struktur Proyek

```
Cursor_klonik/
├── index.html              # Halaman utama
├── pages/                   # Halaman modul
│   ├── register.html       # Modul Pendaftaran
│   ├── examination.html    # Modul Pemeriksaan
│   ├── pharmacy.html       # Modul Apotek
│   ├── billing.html        # Modul Pembayaran
│   └── reports.html        # Modul Laporan
├── styles/
│   ├── main.css            # Styling utama
│   └── modules.css         # Styling untuk halaman modul
├── scripts/
│   ├── main.js             # JavaScript utama
│   └── register.js         # JavaScript untuk modul pendaftaran
└── README.md               # Dokumentasi

```

## 🚀 Fitur Lengkap

### ✅ Modul Pendaftaran (`pages/register.html`)
- ✅ Pendaftaran pasien baru dengan form lengkap
- ✅ Pencarian pasien lama dengan search real-time
- ✅ Daftar antrian pasien yang terupdate
- ✅ Edit data pasien
- ✅ Integrasi dengan localStorage untuk data persistence

### ✅ Modul Pemeriksaan (`pages/examination.html`)
- ✅ Pencatatan data vital oleh perawat (tinggi, berat, tensi, suhu)
- ✅ Konsultasi dokter dengan form lengkap
- ✅ Riwayat medis pasien yang dapat dilihat
- ✅ Pencatatan hasil pemeriksaan dan catatan dokter
- ✅ Integrasi dengan resep obat

### ✅ Modul Apotek (`pages/pharmacy.html`)
- ✅ Pengelolaan resep masuk dari dokter
- ✅ Proses distribusi obat dengan pengecekan stok
- ✅ Manajemen stok obat dengan tabel interaktif
- ✅ Alert stok habis/menipis
- ✅ Tambah/edit obat baru
- ✅ Pencarian obat

### ✅ Modul Pembayaran (`pages/billing.html`)
- ✅ Perhitungan biaya otomatis (pemeriksaan + obat)
- ✅ Proses pembayaran dengan multiple metode (Tunai, Transfer, Kartu)
- ✅ Cetak struk/kwitansi dengan format profesional
- ✅ Riwayat pembayaran lengkap

### ✅ Modul Laporan (`pages/reports.html`)
- ✅ Dashboard dengan statistik real-time
- ✅ Laporan harian dengan filter tanggal
- ✅ Laporan bulanan dengan breakdown harian
- ✅ Data pasien dengan pencarian
- ✅ Export PDF (placeholder untuk implementasi)

## 🛠️ Teknologi

- **HTML5**: Struktur halaman
- **CSS3**: Styling dengan custom properties dan modern layout
- **JavaScript (Vanilla)**: Interaktivitas dan logika aplikasi
- **Font Awesome**: Icons

## 📋 Aktor Sistem

1. **Pasien** - Melakukan pendaftaran dan pembayaran
2. **Petugas Administrasi** - Mengelola pendaftaran, pembayaran, dan laporan
3. **Perawat** - Mencatat data vital pasien
4. **Dokter** - Melakukan pemeriksaan dan membuat resep
5. **Petugas Apotek** - Mengelola resep dan stok obat
6. **Pemilik Klinik** - Melihat laporan

## 🎯 Cara Menggunakan

### Menjalankan Website

1. **Buka halaman utama**: Buka file `index.html` di browser modern (Chrome, Firefox, Edge, Safari)
2. **Navigasi**: Gunakan menu navigasi di header untuk berpindah antar modul
3. **Alur kerja lengkap**:
   - **Pendaftaran**: Daftarkan pasien baru atau cari pasien lama
   - **Pemeriksaan**: Catat data vital dan lakukan konsultasi
   - **Apotek**: Proses resep dan kelola stok obat
   - **Pembayaran**: Proses pembayaran dan cetak struk
   - **Laporan**: Lihat dashboard dan laporan harian/bulanan

### Fitur Data Persistence

Website menggunakan **localStorage** untuk menyimpan data sementara:
- Data pasien tersimpan di `patientQueue`
- Data pemeriksaan tersimpan di `medicalRecords`
- Data resep tersimpan di `processedPrescriptions`
- Data pembayaran tersimpan di `paymentHistory`
- Data obat tersimpan di `medicines`

**Catatan**: Data akan hilang jika browser cache dibersihkan. Untuk produksi, diperlukan backend API dan database.

## 📝 Catatan Pengembangan

- Website ini adalah frontend prototype
- Untuk implementasi penuh, diperlukan backend API
- Database schema sudah didefinisikan dalam PRD
- Styling mengikuti desain modern seperti platform Sunrise

## 📄 Referensi

- **PRD**: `Klinik_sentosa.md`
- **Analisis Use Case**: `Analisis_Use_Case_Diagram_Klinik_Sentosa.md`

---

**Dikembangkan untuk**: Sistem Analisis dan Desain (SAD) - Semester 3

