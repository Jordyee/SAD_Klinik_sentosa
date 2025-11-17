# Analisis Use Case Diagram - Klinik Sentosa

## 1. Identifikasi Aktor (Actors)

Berdasarkan transkrip wawancara dan use case scenario, aktor-aktor yang teridentifikasi dalam sistem Klinik Sentosa adalah:

### Aktor Utama:
1. **Pasien** 
   - Pasien Baru (first-time patient)
   - Pasien Lama (returning patient)

2. **Dokter**
   - Memeriksa pasien
   - Membuat resep obat
   - Mencatat hasil pemeriksaan

3. **Perawat**
   - Mencatat data awal pasien (tinggi badan, berat badan, tensi darah)
   - Membantu dokter dalam pemeriksaan

4. **Petugas Administrasi**
   - Mengurus pendaftaran pasien
   - Mengelola pembayaran
   - Membuat laporan untuk pemilik klinik
   - Menyiapkan catatan kesehatan pasien

5. **Petugas Apotek**
   - Menyiapkan dan memberikan obat
   - Mencatat pengeluaran obat
   - Mengelola stok obat

6. **Pemilik Klinik**
   - Menerima laporan harian/bulanan
   - Memantau kinerja klinik

---

## 2. Identifikasi Use Case

Berdasarkan analisis dokumen, use case yang teridentifikasi adalah:

### 2.1 Use Case Pendaftaran
- **Melakukan Pendaftaran (Pasien Baru)**
  - Deskripsi: Proses pendaftaran pasien baru di klinik
  - Aktor: Pasien, Petugas Administrasi
  - Alur Normal:
    1. Pasien datang ke bagian administrasi
    2. Pasien memberikan informasi dasar (nama, alamat, telp, keluhan)
    3. Petugas Administrasi mencatat data pasien baru ke sistem
    4. Pasien menunggu di ruang tunggu untuk dipanggil
  - Pengecualian: Jika terjadi kesalahan pencatatan data, Petugas Administrasi dapat memperbaikinya di sistem

- **Melakukan Pendaftaran (Pasien Lama)**
  - Deskripsi: Proses pendaftaran pasien yang sudah pernah berobat
  - Aktor: Pasien, Petugas Administrasi
  - Alur Normal:
    1. Pasien datang ke bagian administrasi
    2. Pasien memberitahu bahwa dia pasien lama
    3. Petugas Administrasi mencari data pasien di sistem
    4. Pasien menunggu di ruang tunggu untuk dipanggil
  - Pengecualian: Jika pasien membatalkan pendaftaran saat menunggu, statusnya dibatalkan

### 2.2 Use Case Pemeriksaan
- **Melakukan Pemeriksaan**
  - Deskripsi: Proses pemeriksaan kondisi pasien oleh staf medis
  - Aktor: Perawat, Dokter, Petugas Administrasi
  - Alur Normal:
    1. Pasien dipanggil dari ruang tunggu
    2. Perawat mencatat data awal (tinggi, berat, tensi)
    3. Petugas Administrasi menyiapkan catatan kesehatan/riwayat medis sebelumnya
    4. Dokter melihat daftar antrian dan riwayat medis pasien
    5. Dokter menanyakan keluhan dan melakukan pemeriksaan fisik
    6. Dokter mencatat hasil pemeriksaan

### 2.3 Use Case Pengelolaan Obat
- **Mengelola Resep & Obat**
  - Deskripsi: Proses dokter membuat resep dan apotek menyiapkannya
  - Aktor: Dokter, Petugas Apotek, Pasien
  - Alur Normal:
    1. Dokter membuat resep obat jika diperlukan
    2. Pasien membawa resep ke apotek
    3. Petugas Apotek memeriksa resep
    4. Petugas Apotek menyiapkan obat
    5. Petugas Apotek mencatat obat yang keluar
    6. Petugas Apotek memberikan obat (dan penjelasan) ke pasien
  - Alur Alternatif: Jika obat yang diresepkan habis, Petugas Apotek memberitahu pasien dan menyarankan obat alternatif atau meminta pasien kembali lagi nanti

- **Mengelola Stok Obat**
  - Deskripsi: Proses pencatatan sisa stok obat oleh apotek
  - Aktor: Petugas Apotek
  - Alur Normal:
    1. Petugas Apotek memeriksa stok obat secara rutin (harian)
    2. Petugas Apotek mencatat jumlah sisa obat ke dalam daftar/sistem
    3. Sistem memberi info obat yang perlu dipesan ulang

### 2.4 Use Case Pembayaran
- **Melakukan Pembayaran**
  - Deskripsi: Proses pasien membayar total biaya layanan
  - Aktor: Pasien, Petugas Administrasi
  - Alur Normal:
    1. Setelah selesai diperiksa dan mendapat obat, pasien pergi ke bagian administrasi
    2. Petugas Administrasi memberitahukan rincian biaya (pemeriksaan dan obat)
    3. Pasien melakukan pembayaran
    4. Petugas Administrasi memberikan bukti bayar (struk/kwitansi)

### 2.5 Use Case Pelaporan
- **Membuat Laporan**
  - Deskripsi: Proses pembuatan laporan klinik untuk pemilik
  - Aktor: Petugas Administrasi, Pemilik Klinik
  - Alur Normal:
    1. Petugas Administrasi mencatat semua data pasien dan transaksi
    2. Secara harian/bulanan, Petugas Administrasi menyusun laporan
    3. Laporan (jumlah pasien, total pendapatan) diberikan kepada Pemilik Klinik

---

## 3. Analisis Relasi (Relationships)

### 3.1 Relasi Aktor-Use Case
- **Pasien** berinteraksi dengan:
  - Melakukan Pendaftaran (Pasien Baru)
  - Melakukan Pendaftaran (Pasien Lama)
  - Melakukan Pembayaran
  - Mengelola Resep & Obat (sebagai penerima)

- **Dokter** berinteraksi dengan:
  - Melakukan Pemeriksaan
  - Mengelola Resep & Obat

- **Perawat** berinteraksi dengan:
  - Melakukan Pemeriksaan

- **Petugas Administrasi** berinteraksi dengan:
  - Melakukan Pendaftaran (Pasien Baru)
  - Melakukan Pendaftaran (Pasien Lama)
  - Melakukan Pemeriksaan (menyiapkan catatan)
  - Melakukan Pembayaran
  - Membuat Laporan

- **Petugas Apotek** berinteraksi dengan:
  - Mengelola Resep & Obat
  - Mengelola Stok Obat

- **Pemilik Klinik** berinteraksi dengan:
  - Membuat Laporan (menerima laporan)

### 3.2 Relasi Use Case (jika ada)
- **Include Relationship**: 
  - "Melakukan Pemeriksaan" mungkin include "Mencatat Data Awal" (oleh perawat)
  
- **Extend Relationship**: 
  - "Mengelola Resep & Obat" dapat di-extend dengan "Menangani Stok Habis"

- **Generalization**:
  - "Melakukan Pendaftaran (Pasien Baru)" dan "Melakukan Pendaftaran (Pasien Lama)" dapat digeneralisasi menjadi "Melakukan Pendaftaran"

---

## 4. Analisis Struktur Use Case Diagram

### 4.1 Kekuatan Struktur
1. **Pemisahan yang Jelas**: Use case terpisah untuk pasien baru dan pasien lama menunjukkan perbedaan proses yang penting
2. **Cakupan Lengkap**: Semua proses utama dari pendaftaran hingga pembayaran tercakup
3. **Aktor yang Spesifik**: Setiap aktor memiliki peran yang jelas dan terdefinisi

### 4.2 Area yang Perlu Perbaikan
1. **Use Case Terlalu Detail**: Beberapa use case seperti "Mengelola Stok Obat" mungkin lebih tepat sebagai aktivitas internal sistem
2. **Missing Use Cases**: 
   - Tidak ada use case untuk "Membatalkan Pendaftaran" secara eksplisit
   - Tidak ada use case untuk "Memperbaiki Data Pasien"
   - Tidak ada use case untuk "Melihat Riwayat Medis" (untuk dokter)
3. **Aktor yang Kurang Spesifik**: 
   - "Pemilik Klinik" mungkin perlu use case tambahan seperti "Melihat Laporan" atau "Mengelola Klinik"

---

## 5. Rekomendasi Perbaikan

### 5.1 Penambahan Use Case
1. **Membatalkan Pendaftaran**
   - Aktor: Pasien
   - Deskripsi: Pasien dapat membatalkan pendaftaran saat menunggu

2. **Memperbaiki Data Pasien**
   - Aktor: Petugas Administrasi
   - Deskripsi: Memperbaiki kesalahan pencatatan data pasien

3. **Melihat Riwayat Medis**
   - Aktor: Dokter
   - Deskripsi: Dokter melihat catatan kesehatan pasien dari kunjungan sebelumnya

4. **Melihat Laporan**
   - Aktor: Pemilik Klinik
   - Deskripsi: Pemilik klinik melihat laporan harian/bulanan

### 5.2 Perbaikan Struktur
1. **Gunakan Generalization untuk Pendaftaran**:
   - Buat use case umum "Melakukan Pendaftaran" sebagai parent
   - "Melakukan Pendaftaran (Pasien Baru)" dan "Melakukan Pendaftaran (Pasien Lama)" sebagai child

2. **Pisahkan Use Case Internal dari External**:
   - "Mengelola Stok Obat" mungkin lebih tepat sebagai aktivitas internal sistem atau use case sekunder

3. **Tambahkan Include/Extend Relationships**:
   - "Melakukan Pemeriksaan" include "Mencatat Data Awal"
   - "Mengelola Resep & Obat" extend "Menangani Stok Habis"

### 5.3 Klarifikasi Aktor
1. **Pisahkan Aktor Pasien**:
   - Pertimbangkan untuk membuat aktor terpisah: "Pasien Baru" dan "Pasien Lama" jika perbedaannya signifikan
   - Atau gunakan satu aktor "Pasien" dengan use case yang berbeda

2. **Definisi Aktor yang Lebih Jelas**:
   - Pastikan setiap aktor memiliki deskripsi peran yang jelas
   - Pertimbangkan apakah "Pemilik Klinik" perlu akses langsung ke sistem atau hanya menerima laporan

---

## 6. Kesimpulan

Use Case Diagram untuk Klinik Sentosa secara keseluruhan sudah cukup komprehensif dan mencakup proses utama dari sistem klinik. Struktur use case sudah baik dengan pemisahan yang jelas antara pasien baru dan pasien lama.

**Kekuatan utama**:
- Cakupan proses yang lengkap
- Aktor yang terdefinisi dengan baik
- Alur normal dan alternatif sudah diidentifikasi

**Area perbaikan**:
- Penambahan use case untuk operasi tambahan (pembatalan, perbaikan data)
- Penggunaan relationship (include/extend) yang lebih eksplisit
- Klarifikasi use case internal vs eksternal

Dengan perbaikan yang disarankan, Use Case Diagram ini akan menjadi lebih lengkap dan mudah dipahami oleh semua stakeholder sistem.

---

## 7. Mapping Use Case dengan PRD (Product Requirements Document)

### 7.1 Mapping Use Case dengan Modul Sistem

Berdasarkan PRD, sistem akan dibangun dengan komponen modular. Berikut mapping antara Use Case dengan modul yang direncanakan:

| Use Case | Modul PRD | Komponen PRD |
|----------|-----------|--------------|
| **Melakukan Pendaftaran (Pasien Baru)** | `RegistrationModule` | `NewPatientForm` |
| **Melakukan Pendaftaran (Pasien Lama)** | `RegistrationModule` | `PatientSearchForm` |
| **Membatalkan Pendaftaran** | `RegistrationModule` | (Perlu ditambahkan: `CancelRegistrationForm`) |
| **Memperbaiki Data Pasien** | `RegistrationModule` | `EditPatientDataForm` |
| **Melakukan Pemeriksaan** | `ExaminationModule` | `VitalsInputForm`, `ConsultationView` |
| **Melihat Riwayat Medis** | `ExaminationModule` | `PatientHistoryViewer` |
| **Mengelola Resep & Obat** | `PharmacyModule` | `PrescriptionQueueView`, `DispenseMedicineForm` |
| **Mengelola Stok Obat** | `PharmacyModule` | `StockManagementTable` |
| **Menangani Stok Habis** | `PharmacyModule` | `OutOfStockAlert` |
| **Melakukan Pembayaran** | `BillingModule` | `BillingForm`, `ReceiptGenerator` |
| **Membuat Laporan** | `ReportModule` | `ReportGeneratorForm` |
| **Melihat Laporan** | `ReportModule` | `ReportDashboard` |

### 7.2 Mapping Use Case dengan Database Schema

Setiap Use Case akan berinteraksi dengan tabel-tabel tertentu dalam database:

| Use Case | Tabel Database yang Terlibat |
|----------|----------------------------|
| **Melakukan Pendaftaran (Pasien Baru)** | `Patients`, `Visits`, `Users` |
| **Melakukan Pendaftaran (Pasien Lama)** | `Patients`, `Visits`, `Users` |
| **Melakukan Pemeriksaan** | `Visits`, `Medical_Records`, `Users` |
| **Mengelola Resep & Obat** | `Prescriptions`, `Prescription_Details`, `Medicines`, `Users` |
| **Mengelola Stok Obat** | `Medicines` |
| **Melakukan Pembayaran** | `Payments`, `Visits`, `Users` |
| **Membuat Laporan** | `Reports`, `Visits`, `Payments`, `Users` |

### 7.3 Verifikasi Konsistensi dengan PRD

#### ✅ Konsistensi Aktor
PRD menyebutkan 6 aktor yang sesuai dengan analisis Use Case Diagram:
- ✅ Pasien
- ✅ Petugas Administrasi
- ✅ Perawat
- ✅ Dokter
- ✅ Petugas Apotek
- ✅ Pemilik Klinik

#### ✅ Konsistensi Use Case
Semua use case utama yang teridentifikasi dalam analisis sudah tercakup dalam PRD melalui modul-modul yang direncanakan.

#### ⚠️ Use Case yang Perlu Ditambahkan ke PRD
Berdasarkan analisis Use Case Diagram, beberapa use case berikut perlu ditambahkan atau diperjelas dalam PRD:
1. **Membatalkan Pendaftaran** - Perlu komponen `CancelRegistrationForm` di `RegistrationModule`
2. **Melihat Riwayat Medis** - Sudah ada `PatientHistoryViewer`, perlu dipastikan sebagai use case terpisah
3. **Melihat Laporan** - Sudah ada `ReportDashboard`, perlu dipastikan sebagai use case terpisah

### 7.4 Alur Pengguna (User Flow) dalam PRD vs Use Case

PRD mendefinisikan alur pengguna utama yang sejalan dengan use case scenario:

1. **Pasien Datang** → Use Case: "Melakukan Pendaftaran"
2. **Pasien Menunggu** → Use Case: (Tersirat dalam sistem antrian)
3. **Pemeriksaan Awal** → Use Case: "Melakukan Pemeriksaan" (bagian perawat)
4. **Konsultasi** → Use Case: "Melakukan Pemeriksaan" (bagian dokter)
5. **Penebusan Obat** → Use Case: "Mengelola Resep & Obat"
6. **Pembayaran** → Use Case: "Melakukan Pembayaran"
7. **Pulang** → Use Case: "Melakukan Pembayaran" (menerima struk)

### 7.5 Rekomendasi Integrasi Use Case Diagram dengan PRD

1. **Tambahkan Use Case Eksplisit untuk Operasi Internal**:
   - "Melihat Antrian Pasien" (untuk Dokter dan Admin)
   - "Mencari Pasien" (untuk Admin)

2. **Perjelas Use Case untuk Pemilik Klinik**:
   - "Melihat Laporan" harus menjadi use case terpisah, bukan hanya bagian dari "Membuat Laporan"

3. **Tambahkan Use Case untuk Manajemen Stok**:
   - "Mengelola Stok Obat" sudah ada, tetapi perlu ditambahkan use case "Memesan Obat" jika stok menipis

4. **Sinkronkan dengan Komponen UI**:
   - Pastikan setiap use case memiliki komponen UI yang jelas dalam PRD
   - Pastikan setiap komponen UI mendukung minimal satu use case

---

## 8. Kesimpulan Integrasi

Analisis Use Case Diagram menunjukkan konsistensi yang baik dengan PRD. Semua aktor dan use case utama sudah tercakup dalam desain sistem yang direncanakan. Namun, beberapa use case tambahan perlu diperjelas atau ditambahkan untuk memastikan kelengkapan sistem.

**Konsistensi yang Baik**:
- ✅ Semua aktor sudah terdefinisi dengan jelas
- ✅ Modul-modul dalam PRD sudah mencakup use case utama
- ✅ Database schema sudah mendukung semua use case
- ✅ User flow dalam PRD sejalan dengan use case scenario

**Perlu Perbaikan**:
- ⚠️ Beberapa use case perlu komponen UI yang lebih eksplisit
- ⚠️ Use case untuk operasi internal (melihat antrian, mencari pasien) perlu ditambahkan
- ⚠️ Use case untuk pemilik klinik perlu diperjelas

Dengan integrasi yang lebih baik antara Use Case Diagram dan PRD, sistem akan lebih mudah diimplementasikan dan diuji.

---

**Dokumen ini dibuat berdasarkan analisis file: "Analisis Use Case Diagram.pdf"**
**Referensi PRD: "Klinik_sentosa.md"**
**Tanggal Analisis: 2025**

