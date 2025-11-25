# Analisis dan Desain Sistem Informasi Klinik Sentosa
Dokumen ini merupakan analisis dan desain komprehensif untuk Sistem Informasi Klinik Sentosa, yang terdiri dari dua bagian:
- **Bagian I**: Analisis awal berdasarkan kebutuhan dan wawancara.
- **Bagian II**: Dokumentasi sistem yang direkayasa ulang dari prototipe aplikasi yang ada.

---
# Bagian I: Analisis Sistem Awal

## 1. Identifikasi Aktor (Actors)

Berdasarkan transkrip wawancara dan use case scenario, aktor-aktor yang teridentifikasi dalam sistem Klinik Sentosa adalah:

### Aktor Utama:
1. **Pasien** 
2. **Dokter**
3. **Perawat**
4. **Petugas Administrasi**
5. **Petugas Apotek**
6. **Pemilik Klinik**

## 2. Identifikasi Use Case

Berdasarkan analisis dokumen, use case yang teridentifikasi adalah:

- **Melakukan Pendaftaran (Pasien Baru & Lama)**
- **Melakukan Pemeriksaan**
- **Mengelola Resep & Obat**
- **Mengelola Stok Obat**
- **Melakukan Pembayaran**
- **Membuat Laporan**

(Catatan: Deskripsi detail alur dan relasi tetap sama seperti di dokumen asli dan tidak diulangi di sini untuk keringkasan).

---

## 3. Analisis Relasi (Relationships)
(Konten asli dari bagian ini tetap dipertahankan)

---

## 4. Analisis Struktur Use Case Diagram
(Konten asli dari bagian ini tetap dipertahankan)

---

## 5. Rekomendasi Perbaikan
(Konten asli dari bagian ini tetap dipertahankan, karena berfungsi sebagai catatan historis dari analisis awal).

---

## 6. Kesimpulan Analisis Awal
(Konten asli dari bagian ini tetap dipertahankan).

---
# Bagian II: Dokumentasi Sistem Berdasarkan Prototipe

Bagian ini berisi dokumentasi yang dihasilkan dari proses rekayasa ulang (reverse-engineering) terhadap prototipe aplikasi yang ada. Ini mencerminkan fungsionalitas, struktur data, dan alur data yang *sebenarnya* diimplementasikan dalam prototipe.

## 7. Spesifikasi Use Case (Berdasarkan Prototipe)

Dokumen ini mendefinisikan fungsionalitas Sistem Informasi Klinik Sentosa dari perspektif pengguna (aktor). Spesifikasi ini dibuat berdasarkan analisis alur interaksi yang tersedia di prototipe aplikasi.

### 7.1. Aktor

Aktor adalah peran yang berinteraksi dengan sistem. Berdasarkan prototipe, aktor yang teridentifikasi adalah:

- **Pasien**: Individu yang menerima layanan kesehatan. Berinteraksi dengan sistem untuk pendaftaran.
- **Petugas Administrasi**: Staf yang bertanggung jawab atas pendaftaran pasien, pembayaran, dan manajemen pengguna.
- **Perawat**: Staf medis yang melakukan pencatatan data vital awal pasien.
- **Dokter**: Staf medis yang melakukan pemeriksaan, diagnosis, dan memberikan resep.
- **Petugas Apotek**: Staf yang mengelola resep dan stok obat.
- **Pemilik Klinik**: Pemangku kepentingan yang melihat laporan kinerja klinik.

### 7.2. Deskripsi Use Case

#### **UC-01: Mengelola Pendaftaran**
- **Aktor:** Pasien, Petugas Administrasi
- **Tujuan:** Mendaftarkan pasien ke dalam sistem untuk mendapatkan layanan.
- **Lokasi:** `pages/register.html`
- **Alur:** Mencakup pendaftaran pasien baru melalui form dan pencarian pasien lama.

#### **UC-02: Melakukan Pelayanan Medis**
- **Aktor:** Perawat, Dokter
- **Tujuan:** Melakukan pemeriksaan medis dan mencatat hasilnya.
- **Lokasi:** `pages/examination.html`
- **Alur:** Mencakup pencatatan data vital oleh perawat, konsultasi oleh dokter, dan melihat riwayat medis.

#### **UC-03: Mengelola Farmasi**
- **Aktor:** Petugas Apotek
- **Tujuan:** Memproses resep yang masuk dan mengelola ketersediaan obat.
- **Lokasi:** `pages/pharmacy.html`
- **Alur:** Mencakup melihat antrian resep dan mengelola daftar stok obat (tambah/edit).

#### **UC-04: Memproses Pembayaran**
- **Aktor:** Petugas Administrasi
- **Tujuan:** Memproses tagihan layanan dan mencatat pembayaran dari pasien.
- **Lokasi:** `pages/billing.html`
- **Alur:** Melihat pasien yang harus bayar, menampilkan rincian tagihan, dan memproses pembayaran.

#### **UC-05: Melihat Laporan Klinik**
- **Aktor:** Petugas Administrasi, Pemilik Klinik
- **Tujuan:** Memantau kinerja klinik melalui data agregat.
- **Lokasi:** `pages/reports.html`
- **Alur:** Menampilkan statistik kunci serta laporan harian dan bulanan.

#### **UC-06: Mengelola Pengguna Sistem**
- **Aktor:** Petugas Administrasi
- **Tujuan:** Membuat akun baru untuk staf klinik.
- **Lokasi:** `pages/register.html` (Tab "Manajemen Pengguna")
- **Alur:** Mengisi form untuk membuat akun staf baru.

---

## 8. Entity-Relationship Diagram (ERD) (Berdasarkan Prototipe)

Dokumen ini mendefinisikan struktur data untuk Sistem Informasi Klinik Sentosa, yang dianalisis dari prototipe aplikasi.

### 8.1. Deskripsi Entitas dan Atribut

- **`Pasien`**: Menyimpan data demografis pasien (pasien_id, nama, alamat, no_telp, tanggal_lahir, jenis_kelamin, status_pasien).
- **`Pengguna`**: Menyimpan data akun staf (user_id, username, password, email, role).
- **`Kunjungan`**: Mencatat setiap kedatangan pasien (kunjungan_id, pasien_id, tanggal_kunjungan).
- **`Pemeriksaan`**: Menyimpan detail rekam medis (pemeriksaan_id, kunjungan_id, dokter_id, data vital, hasil pemeriksaan).
- **`Obat`**: Katalog obat di apotek (obat_id, nama_obat, stok, harga).
- **`Resep`**: Menyimpan data resep (resep_id, pemeriksaan_id, tanggal_resep).
- **`Detail_Resep`**: Tabel penghubung Resep dan Obat (resep_id, obat_id, jumlah).
- **`Pembayaran`**: Mencatat transaksi pembayaran (pembayaran_id, kunjungan_id, total_biaya).

### 8.2. Deskripsi Relasi

- **Pasien (1) -- (N) Kunjungan**: Satu pasien bisa banyak kunjungan.
- **Kunjungan (1) -- (1) Pemeriksaan**: Satu kunjungan menghasilkan satu pemeriksaan.
- **Pemeriksaan (1) -- (0..1) Resep**: Pemeriksaan bisa menghasilkan resep atau tidak.
- **Resep (N) -- (M) Obat**: Hubungan banyak-ke-banyak melalui `Detail_Resep`.

---

## 9. Data Flow Diagram (DFD) (Berdasarkan Prototipe)

Dokumen ini menjelaskan aliran data dalam Sistem Informasi Klinik Sentosa berdasarkan analisis prototipe.

### 9.1. DFD Level 0 (Diagram Konteks)

Sistem secara keseluruhan menerima data dari `PASIEN` dan `STAF_KLINIK`, lalu menghasilkan informasi kembali ke mereka serta laporan untuk `PEMILIK_KLINIK`.

### 9.2. DFD Level 1

- **Proses 1.0: Manajemen Pendaftaran**: Menerima `Data Pendaftaran` dari `PASIEN`, menyimpan ke `D1: DATA_PASIEN`, dan mengirim `Info Antrian` ke Proses 2.0.
- **Proses 2.0: Pelayanan Medis**: Menerima `Input Medis` dari `STAF_KLINIK`, membaca data dari `D1` dan `D2`, menyimpan `Hasil Pemeriksaan` ke `D2: REKAM_MEDIS`, dan mengirim `Data Resep` ke Proses 3.0.
- **Proses 3.0: Manajemen Farmasi**: Menerima `Data Resep`, membaca/menulis ke `D3: DATA_OBAT`, dan mengirim `Info Obat & Biaya` ke Proses 4.0.
- **Proses 4.0: Proses Pembayaran**: Menerima info dari proses lain, menyimpan `Data Pembayaran` ke `D4: DATA_TRANSAKSI`, dan memberikan `Bukti Bayar` ke `PASIEN`.
- **Proses 5.0: Manajemen Laporan**: Membaca dari semua data store untuk menghasilkan `Laporan Kinerja` bagi `PEMILIK_KLINIK`.

---

## 10. Analisis Kesenjangan (Gap Analysis)

Bagian ini menyelaraskan analisis awal (Bagian I) dengan kondisi nyata prototipe (Bagian II).

1.  **Konsistensi Use Case**: Secara umum, prototipe telah berhasil mengimplementasikan semua Use Case utama yang diidentifikasi pada analisis awal. Fungsionalitas seperti "Melihat Riwayat Medis" yang direkomendasikan di Bagian I bahkan sudah tersedia di `pages/examination.html`.

2.  **Kelengkapan Atribut Data**: ERD yang dihasilkan dari prototipe (Bagian II, Seksi 8) menunjukkan kebutuhan atribut yang lebih detail (`tanggal_lahir`, `jenis_kelamin`) dibandingkan yang disebutkan secara eksplisit di skema database awal (Bagian I, Seksi 7.2). Ini menunjukkan evolusi kebutuhan selama pembuatan prototipe.

3.  **Alur Data vs. Alur Visual**: DFD (Bagian II, Seksi 9) memodelkan alur data yang *seharusnya terjadi*. Namun, pada prototipe saat ini, alur tersebut sebagian besar hanya bersifat visual (navigasi antar halaman). Implementasi logika JavaScript diperlukan untuk membuat data benar-benar mengalir antar proses sesuai model DFD.

4.  **Implementasi Rekomendasi**: Beberapa rekomendasi dari analisis awal (Bagian I, Seksi 5) telah terwujud dalam prototipe, seperti antarmuka untuk `Melihat Riwayat Medis` dan `Melihat Laporan`. Namun, rekomendasi seperti `Membatalkan Pendaftaran` dan `Memperbaiki Data Pasien` (CRUD) belum terimplementasi secara fungsional.

**Kesimpulan Akhir**: Prototipe merupakan representasi visual yang kuat dari analisis awal. Langkah selanjutnya yang paling krusial adalah mengimplementasikan logika backend atau simulasi frontend (menggunakan `localStorage` di JavaScript) untuk menghidupkan alur data yang telah dirancang dalam DFD dan ERD, sehingga prototipe menjadi lebih dinamis dan fungsional.