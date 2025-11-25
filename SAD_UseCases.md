# Sistem Analisis dan Desain - Spesifikasi Use Case

Dokumen ini mendefinisikan fungsionalitas Sistem Informasi Klinik Sentosa dari perspektif pengguna (aktor). Spesifikasi ini dibuat berdasarkan analisis alur interaksi yang tersedia di prototipe aplikasi.

## 1. Aktor

Aktor adalah peran yang berinteraksi dengan sistem. Berdasarkan prototipe, aktor yang teridentifikasi adalah:

- **Pasien**: Individu yang menerima layanan kesehatan. Berinteraksi dengan sistem untuk pendaftaran.
- **Petugas Administrasi**: Staf yang bertanggung jawab atas pendaftaran pasien, pembayaran, dan manajemen pengguna.
- **Perawat**: Staf medis yang melakukan pencatatan data vital awal pasien.
- **Dokter**: Staf medis yang melakukan pemeriksaan, diagnosis, dan memberikan resep.
- **Petugas Apotek**: Staf yang mengelola resep dan stok obat.
- **Pemilik Klinik**: Pemangku kepentingan yang melihat laporan kinerja klinik.

## 2. Diagram Use Case (Level Konseptual)

Berikut adalah representasi tekstual dari interaksi Aktor dan Use Case utama:

```
(Pasien) --|> Mengelola Pendaftaran

(Petugas Administrasi) --|> Mengelola Pendaftaran
(Petugas Administrasi) --|> Memproses Pembayaran
(Petugas Administrasi) --|> Mengelola Pengguna Sistem
(Petugas Administrasi) --|> Melihat Laporan Klinik

(Perawat) --|> Melakukan Pelayanan Medis
               (<<includes>> Mencatat Data Vital)

(Dokter) --|> Melakukan Pelayanan Medis
             (<<includes>> Melakukan Konsultasi)
             (<<includes>> Memberi Resep)
             (<<includes>> Melihat Riwayat Medis)

(Petugas Apotek) --|> Mengelola Farmasi

(Pemilik Klinik) --|> Melihat Laporan Klinik
```

## 3. Deskripsi Use Case

### **UC-01: Mengelola Pendaftaran**
- **Aktor:** Pasien, Petugas Administrasi
- **Tujuan:** Mendaftarkan pasien ke dalam sistem untuk mendapatkan layanan.
- **Lokasi:** `pages/register.html`
- **Alur Utama (Pasien Baru):**
    1. Aktor membuka halaman Pendaftaran.
    2. Aktor memilih tab "Pasien Baru".
    3. Aktor mengisi form data pribadi (nama, alamat, no. telp, status, tgl. lahir, jenis kelamin).
    4. Aktor menekan tombol "Simpan & Daftarkan".
    5. Sistem (secara konseptual) menyimpan data dan memasukkan pasien ke daftar antrian.
- **Alur Alternatif (Pasien Lama):**
    1. Aktor membuka halaman Pendaftaran.
    2. Aktor memilih tab "Pasien Lama".
    3. Aktor memasukkan kata kunci (nama/ID) di kolom pencarian.
    4. Sistem (secara konseptual) menampilkan data pasien yang cocok.

### **UC-02: Melakukan Pelayanan Medis**
- **Aktor:** Perawat, Dokter
- **Tujuan:** Melakukan pemeriksaan medis dan mencatat hasilnya.
- **Lokasi:** `pages/examination.html`
- **Alur Utama:**
    1. Perawat memilih tab "Data Vital".
    2. Perawat memilih pasien dari antrian, lalu mengisi dan menyimpan data vital (tinggi, berat, tensi).
    3. Dokter memilih tab "Konsultasi Dokter".
    4. Dokter memilih pasien yang sama, dan sistem menampilkan data vital yang telah diisi perawat.
    5. Dokter mengisi hasil pemeriksaan, catatan, dan membuat resep jika perlu.
    6. Dokter menekan tombol "Simpan Hasil Pemeriksaan".
    7. Sistem (secara konseptual) menyimpan rekam medis dan mengirim resep ke modul apotek.
- **Sub-Use Case (Include):**
    - **Melihat Riwayat Medis**: Dokter dapat mengakses tab "Riwayat Medis" untuk melihat histori kunjungan pasien.

### **UC-03: Mengelola Farmasi**
- **Aktor:** Petugas Apotek
- **Tujuan:** Memproses resep yang masuk dan mengelola ketersediaan obat.
- **Lokasi:** `pages/pharmacy.html`
- **Alur Utama (Proses Resep):**
    1. Aktor membuka halaman Apotek.
    2. Sistem menampilkan daftar resep yang masuk di tab "Resep Masuk".
    3. Aktor memilih satu resep untuk melihat detailnya.
    4. Aktor menyiapkan obat, lalu menekan tombol "Proses Resep".
    5. Sistem (secara konseptual) mengubah status resep dan mengirim notifikasi ke modul pembayaran.
- **Alur Alternatif (Manajemen Stok):**
    1. Aktor memilih tab "Manajemen Stok".
    2. Sistem menampilkan daftar obat beserta stoknya.
    3. Aktor dapat menambah obat baru atau mengedit data obat yang ada.

### **UC-04: Memproses Pembayaran**
- **Aktor:** Petugas Administrasi
- **Tujuan:** Memproses tagihan layanan dan mencatat pembayaran dari pasien.
- **Lokasi:** `pages/billing.html`
- **Alur Utama:**
    1. Aktor membuka halaman Pembayaran.
    2. Sistem menampilkan daftar pasien yang menunggu pembayaran.
    3. Aktor memilih pasien, dan sistem menampilkan rincian biaya (pemeriksaan & obat).
    4. Aktor memilih metode pembayaran dan menekan tombol "Proses Pembayaran".
    5. Sistem (secara konseptual) mencatat transaksi sebagai 'Lunas'.

### **UC-05: Melihat Laporan Klinik**
- **Aktor:** Petugas Administrasi, Pemilik Klinik
- **Tujuan:** Memantau kinerja klinik melalui data agregat.
- **Lokasi:** `pages/reports.html`
- **Alur Utama:**
    1. Aktor membuka halaman Laporan.
    2. Sistem menampilkan ringkasan statistik (total pasien, pendapatan, dll.).
    3. Aktor dapat memilih untuk melihat laporan Harian atau Bulanan.
    4. Aktor dapat mengekspor laporan ke format lain (misalnya PDF).

### **UC-06: Mengelola Pengguna Sistem**
- **Aktor:** Petugas Administrasi
- **Tujuan:** Membuat akun baru untuk staf klinik.
- **Lokasi:** `pages/register.html` (Tab "Manajemen Pengguna")
- **Alur Utama:**
    1. Aktor membuka halaman Pendaftaran dan memilih tab "Manajemen Pengguna".
    2. Aktor mengisi form (username, email, password, role) untuk staf baru.
    3. Aktor menekan tombol "Buat Akun".
    4. Sistem (secara konseptual) membuat akun baru di database pengguna.
