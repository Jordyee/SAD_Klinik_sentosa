# Sistem Informasi Klinik Sentosa

Selamat datang di repositori Sistem Informasi Klinik Sentosa. Proyek ini merupakan aplikasi web full-stack yang dirancang untuk mensimulasikan alur kerja utama di sebuah klinik, mulai dari pendaftaran pasien, pemeriksaan medis, farmasi, hingga pembayaran.

## Deskripsi Singkat

Aplikasi ini menyediakan antarmuka yang bersih dan modern bagi berbagai peran pengguna di klinik (pasien, staf, dokter, pemilik) untuk melakukan tugas-tugas mereka secara efisien. Sistem ini dibangun menggunakan **Node.js** dan **Express** di sisi backend, serta HTML/CSS/JS vanilla di sisi frontend.

## Fitur & Modul Utama

1.  **[Login](pages/login.html)**: Halaman autentikasi untuk staf klinik.
2.  **[Dasbor](pages/dashboard.html)**: Halaman utama setelah login, disesuaikan berdasarkan peran pengguna.
3.  **[Pendaftaran Pasien](pages/register.html)**: Untuk mendaftarkan pasien baru dan mencari data pasien lama.
4.  **[Pemeriksaan Medis](pages/examination.html)**: Alur kerja untuk perawat (input data vital) dan dokter (konsultasi & resep).
5.  **[Apotek/Farmasi](pages/pharmacy.html)**: Manajemen antrian resep, penyerahan obat, dan stok obat.
6.  **[Pembayaran/Billing](pages/billing.html)**: Proses pembayaran untuk layanan dan obat.
7.  **[Laporan](pages/reports.html)**: Dashboard analitik untuk manajemen dan pemilik klinik.

## Penyimpanan Data (JSON)

Sistem ini menggunakan file **JSON** sebagai database sederhana untuk menyimpan semua data aplikasi. File-file ini terletak di folder:

`server/data/`

File data utama meliputi:
*   `users.json`: Data pengguna (admin, dokter, apoteker, kasir).
*   `patients.json`: Data pasien terdaftar.
*   `visits.json`: Data kunjungan/antrian pasien.
*   `medical_records.json`: Rekam medis (diagnosa, resep, tanda vital).
*   `medicines.json`: Data stok obat.
*   `transactions.json`: Riwayat transaksi pembayaran.

> **Catatan**: Folder `server/data/` akan dibuat secara otomatis jika belum ada saat server dijalankan pertama kali.

## Teknologi yang Digunakan

-   **Backend**: Node.js, Express.js
-   **Frontend**: HTML5, CSS3, JavaScript (ES6)
-   **Styling**: CSS kustom dengan arsitektur modular.
-   **Ikon**: Font Awesome.
-   **Alert & Notifikasi**: SweetAlert2.

## Cara Menjalankan Aplikasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal Anda:

### Prasyarat
Pastikan Anda sudah menginstal **Node.js** di komputer Anda.

### Langkah-langkah

1.  **Clone Repositori** (jika belum):
    ```bash
    git clone [URL-repositori-ini]
    ```

2.  **Masuk ke Folder Server**:
    Buka terminal dan arahkan ke folder `server` di dalam proyek.
    ```bash
    cd server
    ```

3.  **Instal Dependensi**:
    Jalankan perintah berikut untuk menginstal paket-paket yang diperlukan (Express, CORS, dll).
    ```bash
    npm install
    ```

4.  **Jalankan Server**:
    Mulai server aplikasi dengan perintah:
    ```bash
    npm run dev
    ```
    Terminal akan menampilkan pesan: `Server is running on http://localhost:3000`

5.  **Buka Aplikasi**:
    Buka browser web Anda (Chrome, Edge, Firefox) dan kunjungi alamat:
    ```
    http://localhost:3000
    ```
    Anda akan diarahkan ke halaman utama (Landing Page).

### Akun Demo (Login)

Gunakan akun berikut untuk masuk ke sistem (`pages/login.html`):

*   **Admin / Pendaftaran**: `admin` / `admin123`
*   **Perawat**: `perawat` / `perawat123`
*   **Dokter**: `dokter` / `dokter123`
*   **Apoteker**: `apotek` / `apotek123`
*   **Kasir**: `kasir` / `kasir123`
*   **Pemilik**: `pemilik` / `pemilik123`

## Struktur Folder

```
.
├── 📄 README.md                                   (Dokumen ini)
├── 📁 pages/                                     (File HTML Frontend)
├── 📁 scripts/                                   (Logika JavaScript Frontend)
├── 📁 styles/                                    (File CSS)
└── 📁 server/                                    (Backend Node.js)
    ├── 📄 server.js                              (Entry point server)
    ├── 📁 controllers/                           (Logika bisnis)
    ├── 📁 routes/                                (Definisi API endpoint)
    ├── 📁 data/                                  (Penyimpanan data JSON)
    └── 📁 utils/                                 (Fungsi bantuan)
```