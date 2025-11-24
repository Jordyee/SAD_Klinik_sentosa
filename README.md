# Sistem Informasi Klinik Sentosa

Selamat datang di repositori Sistem Informasi Klinik Sentosa. Proyek ini merupakan prototipe fungsional berbasis web yang dirancang untuk mensimulasikan alur kerja utama di sebuah klinik, mulai dari pendaftaran pasien hingga pelaporan manajemen.

## Deskripsi Singkat

Aplikasi ini menyediakan antarmuka yang bersih dan modern bagi berbagai peran pengguna di klinik (pasien, staf, dokter, pemilik) untuk melakukan tugas-tugas mereka secara efisien. Prototipe ini dibangun menggunakan teknologi web standar dan fokus pada pengalaman pengguna yang intuitif.

## Fitur & Modul Utama

Prototipe ini mencakup beberapa modul inti:

1.  **[Login](pages/login.html)**: Halaman autentikasi untuk staf klinik.
2.  **[Dasbor](pages/dashboard.html)**: Halaman utama setelah login, disesuaikan berdasarkan peran pengguna.
3.  **[Pendaftaran Pasien](pages/register.html)**: Untuk mendaftarkan pasien baru dan mencari data pasien lama.
4.  **[Pemeriksaan Medis](pages/examination.html)**: Alur kerja untuk perawat (input data vital) dan dokter (konsultasi & resep).
5.  **[Apotek/Farmasi](pages/pharmacy.html)**: Manajemen antrian resep dan stok obat.
6.  **[Pembayaran/Billing](pages/billing.html)**: Proses pembayaran untuk layanan dan obat.
7.  **[Laporan](pages/reports.html)**: Dashboard analitik untuk manajemen dan pemilik klinik.

## Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Styling**: CSS kustom dengan arsitektur modular (`main.css`, `modules.css`).
- **Ikon**: Font Awesome.
- **Alert & Notifikasi**: SweetAlert2.

Tidak ada framework JavaScript (seperti React/Vue/Angular) yang digunakan dalam prototipe ini; semua logika diimplementasikan dengan vanilla JavaScript.

## Struktur Folder

```
.
├── 📄 Analisis_Use_Case_Diagram_Klinik_Sentosa.md  (Dokumen Analisis Awal)
├── 📄 README.md                                   (Anda di sini)
├── 📄 SAD_DFD.md                                  (DFD yang baru dibuat)
├── 📄 SAD_ERD.md                                  (ERD yang baru dibuat)
├── 📄 SAD_UseCases.md                             (Use Cases yang baru dibuat)
├── 📁 pages/                                     (File-file HTML untuk setiap modul)
│   ├── dashboard.html
│   └── ... (register.html, examination.html, dll.)
├── 📁 scripts/                                   (File-file JavaScript untuk logika aplikasi)
│   ├── auth.js
│   └── ... (register.js, examination.js, dll.)
└── 📁 styles/                                    (File-file CSS untuk styling)
    ├── main.css
    └── modules.css
```

- **`pages/`**: Berisi semua halaman atau "layar" dari aplikasi dalam format HTML.
- **`scripts/`**: Berisi logika aplikasi. Setiap file `.js` umumnya terhubung dengan halaman `.html` yang sesuai.
- **`styles/`**: Berisi aturan-aturan styling untuk memastikan tampilan yang konsisten.

## Cara Menjalankan Prototipe

Karena ini adalah proyek frontend murni, tidak diperlukan instalasi atau build step yang kompleks.

1.  **Clone Repositori**:
    ```bash
    git clone [URL-repositori-ini]
    ```
2.  **Buka File di Browser**:
    - Navigasikan ke folder proyek di file explorer Anda.
    - Buka file `index.html` atau `pages/login.html` langsung di browser web modern (seperti Chrome, Firefox, atau Edge).
    - Alternatif: Gunakan ekstensi "Live Server" di editor kode seperti VS Code untuk pengalaman terbaik.

## Dokumentasi Sistem (SAD)

Dokumentasi Sistem Analisis dan Desain (SAD) berikut telah dibuat berdasarkan rekayasa ulang (reverse-engineering) dari kode prototipe ini:

- **[Entity-Relationship Diagram (ERD)](SAD_ERD.md)**: Menjelaskan struktur dan relasi data.
- **[Spesifikasi Use Case](SAD_UseCases.md)**: Mendefinisikan fungsionalitas dari sudut pandang pengguna.
- **[Data Flow Diagram (DFD)](SAD_DFD.md)**: Menggambarkan aliran data di dalam sistem.