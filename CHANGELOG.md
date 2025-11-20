# Klinik Sentosa - Changelog

Dokumen ini merangkum semua perubahan, perbaikan bug, dan penambahan fitur yang telah dilakukan pada aplikasi web Klinik Sentosa. Tujuannya adalah untuk memberikan konteks yang komprehensif bagi pengembang atau agen di masa mendatang untuk memahami evolusi proyek dan fungsionalitasnya.

---

## 8. Implementasi Final Modul Pembayaran (Self-Contained)

**Tanggal:** 19 November 2025
**Kategori:** Perbaikan Kritis, Refaktor Final
**Deskripsi:** Sebagai upaya terakhir dan definitif untuk menyelesaikan masalah pada modul pembayaran, semua logika JavaScript yang diperlukan untuk fungsionalitas halaman pembayaran telah ditanamkan (embedded) langsung di dalam file `pages/billing.html`.
*   **Strategi "Scorched Earth":** Pendekatan ini menghilangkan semua kemungkinan kegagalan yang disebabkan oleh file eksternal, seperti masalah *caching* browser, urutan pemuatan skrip yang salah, atau dependensi antar-file yang hilang.
*   **Logika Lengkap:** Skrip yang ditanamkan mencakup semua fungsi yang diperlukan, mulai dari pengambilan data (`getPrescriptions`, `getMedicines`), render UI (`displayPrescriptionsForBilling`), kalkulasi biaya (`loadBillingDetails`), hingga pemrosesan pembayaran dan struk (`processPayment`, `showReceipt`).
*   **Fungsionalitas Penuh:** Fungsi-fungsi placeholder yang sebelumnya digunakan untuk debugging kini telah diganti dengan implementasi penuhnya, menjadikan halaman pembayaran berfungsi sepenuhnya dari awal hingga akhir.
**File yang Terkena Dampak:**
*   `pages/billing.html`: Dirombak total untuk menjadi file mandiri yang berisi semua HTML dan JavaScript yang relevan.
*   `scripts/billing.js`: File ini sekarang tidak lagi digunakan oleh `billing.html` (meskipun tidak dihapus dari proyek).

---

## 7. Perombakan Total dan Perbaikan Alur Kerja Pembayaran & Apotek

**Tanggal:** 19 November 2025
**Kategori:** Refaktor Kritis, Perbaikan Bug, Peningkatan UX
**Deskripsi:** Melakukan perombakan dan serangkaian perbaikan besar pada modul Apotek dan Pembayaran untuk mengatasi beberapa masalah fundamental yang saling terkait, yang puncaknya adalah ketidakmampuan admin untuk memproses pembayaran.

*   **A. Perbaikan Bug Pembayaran Multi-Resep:**
    *   **Masalah:** Sistem pembayaran awal hanya memproses satu resep per transaksi, menyebabkan resep kedua dari pasien yang sama tetap berstatus `unpaid` setelah pembayaran.
    *   **Solusi:** Logika pembayaran dirombak dari **per-resep** menjadi **pasien-sentris**. Sekarang, sistem mengelompokkan semua resep pasien yang belum lunas ke dalam satu tagihan. Fungsi `processPayment` diperbarui untuk menandai semua resep yang terlibat sebagai `paid` dalam satu transaksi.

*   **B. Penyederhanaan Alur Kerja Apotek:**
    *   **Masalah:** Alur kerja apoteker untuk memproses resep (yang merupakan syarat agar resep muncul di tagihan) tidak intuitif, memerlukan beberapa klik di dalam modal pop-up. Hal ini menyebabkan pengguna sering kali tidak menyelesaikan langkah ini.
    *   **Solusi:** UI dirombak untuk menghapus modal perantara. Apoteker sekarang disajikan dengan tombol aksi langsung pada daftar resep: **"Proses & Kirim ke Kasir"** jika stok cukup, atau **"Laporkan Stok Kurang"** jika tidak. Ini memastikan resep ditransisikan dengan benar ke status `processed`.

*   **C. Perbaikan Interaktivitas & Tampilan UI Pembayaran:**
    *   **Masalah:** Setelah perbaikan logika, pengguna masih melaporkan tidak bisa melihat rincian pembayaran. Investigasi lebih lanjut menemukan dua masalah UI kritis: (1) Kartu pasien tidak dapat diklik karena metode event handler yang usang. (2) Kartu pasien tidak terlihat sama sekali karena kelas CSS-nya tidak didefinisikan.
    *   **Solusi:**
        1.  Mengganti `setAttribute('onclick', ...)` dengan `addEventListener` modern untuk memastikan kartu pasien selalu interaktif.
        2.  Menambahkan definisi style untuk kelas `.patient-billing-card` di `styles/modules.css` agar kartu tersebut memiliki tampilan (latar belakang, border, padding) dan benar-benar terlihat.
        3.  Struktur `pages/billing.html` dirombak untuk menggunakan layout grid dua kolom yang eksplisit, menyediakan tempat yang pasti untuk rincian pembayaran muncul.

*   **D. Perbaikan Arsitektur Kode (Dependensi Error):**
    *   **Masalah:** Ditemukan error kritis di mana `billing.js` memanggil fungsi `getMedicines()` untuk menghitung harga, tetapi fungsi tersebut hanya ada di `pharmacy.js` yang tidak dimuat di halaman pembayaran. Ini menyebabkan script berhenti dan mencegah rincian pembayaran ditampilkan.
    *   **Solusi:** Fungsi `getMedicines()` dan `saveMedicines()` dipindahkan ke file terpusat `scripts/data-integration.js`, sehingga tersedia secara global untuk semua modul yang membutuhkannya.

**File yang Terkena Dampak:**
*   `scripts/billing.js`: Dirombak total untuk logika pasien-sentris dan `addEventListener`.
*   `scripts/pharmacy.js`: Alur kerja disederhanakan, fungsi data obat dihilangkan.
*   `scripts/data-integration.js`: Ditambahkan fungsi `getMedicines()` dan `saveMedicines()`.
*   `pages/billing.html`: Struktur diubah untuk layout grid dua kolom.
*   `styles/modules.css`: Ditambahkan style untuk `.patient-billing-card` dan `.billing-layout`.

---

## 1. Integrasi SweetAlert2 & Peningkatan UX Notifikasi

**Tanggal:** 18 November 2025
**Kategori:** Fitur, Peningkatan UX
**Deskripsi:** Mengganti semua notifikasi dan konfirmasi bawaan browser (alert, confirm, prompt) dengan SweetAlert2. Ini meningkatkan konsistensi visual dan pengalaman pengguna di seluruh aplikasi.
**File yang Terkena Dampak:**
*   `index.html`
*   `pages/*.html` (semua file HTML): Penambahan CDN SweetAlert2 di `<head>`.
*   `scripts/*.js` (semua file JavaScript): Penggantian implementasi `alert()`, `confirm()`, `prompt()` dengan `Swal.fire()`.

---

## 2. Perombakan Modul Login & Registrasi

**Tanggal:** 18 November 2025
**Kategori:** Fitur, Refaktor, Perbaikan Bug
**Deskripsi:** Modul login dan registrasi dirombak total untuk manajemen pengguna yang lebih aman dan terpusat menggunakan `localStorage`.
*   **Pendaftaran Pengguna:** Menambahkan fungsionalitas pendaftaran pengguna baru.
*   **Manajemen Pengguna Admin:** Admin kini memiliki kemampuan untuk mengelola pengguna (melihat, menghapus).
*   **Login Berbasis Peran:** Login sekarang secara ketat memeriksa peran pengguna yang dipilih.
*   **Penautan Data Pasien:** Data pasien sekarang ditautkan ke akun pengguna.
*   **Perbaikan Bug:** Memperbaiki bug pengalihan tab dan data pasien yang hilang dari antrean.
**File yang Terkena Dampak:**
*   `pages/login.html`: Menambahkan formulir registrasi dan logika pengalihan tampilan.
*   `scripts/auth.js`: Dirombak untuk manajemen pengguna berbasis `localStorage` (`registerUser`, `createUser`, `removeUser`). Memperbaiki pengalihan logout. Menyembunyikan tombol "Pembayaran" untuk peran `apotek`.
*   `scripts/login.js`: Direfaktor untuk menggunakan sistem `auth.js` yang baru.
*   `pages/register.html`: Menambahkan tab "Manajemen Pengguna" khusus admin dan modal untuk melihat detail pasien.
*   `scripts/register.js`: Refaktor besar untuk menautkan data pasien ke akun pengguna, mencegah pendaftaran ulang, dan menambahkan logika manajemen pengguna admin.

---

## 3. Sentralisasi Integrasi Data & Manajemen Resep

**Tanggal:** 18 November 2025
**Kategori:** Refaktor, Fitur
**Deskripsi:** Fungsi-fungsi penting untuk manajemen antrean dan data pasien dipusatkan. Struktur data resep diperbarui untuk mendukung pelacakan status pembayaran per-resep.
*   **Fungsi Terpusat:** `getQueue`, `saveQueue`, `updateQueueStatus` dipusatkan.
*   **Manajemen Data Pasien:** Fungsi `getAllPatientData`, `saveAllPatientData`, `findPatientById`, `findPatientByUsername` ditambahkan.
*   **Status Pembayaran Resep:** Menambahkan properti `paymentStatus: 'unpaid'` ke setiap resep baru yang dibuat.
*   **Fungsi Resep Terpusat:** Menambahkan `getPrescriptions()` dan `savePrescriptions()` untuk akses data resep yang konsisten.
*   **Data Sampel:** Menambahkan resep sampel ke `initializeSampleData()` untuk memfasilitasi pengujian alur pembayaran.
**File yang Terkena Dampak:**
*   `scripts/data-integration.js`: Penambahan dan modifikasi fungsi-fungsi di atas.

---

## 4. Peningkatan Modul Pemeriksaan

**Tanggal:** 18 November 2025
**Kategori:** Fitur, Refaktor
**Deskripsi:** Modul pemeriksaan ditingkatkan untuk mendukung alur kerja status resep yang lebih kompleks dan memungkinkan dokter menambahkan item obat ke resep.
*   **Tinjauan Resep:** Menambahkan bagian bagi dokter untuk meninjau resep yang ditandai (misalnya, karena stok obat kurang).
*   **Akses Perawat:** Perawat sekarang memiliki akses ke tab riwayat.
*   **Penambahan Obat ke Resep:** Menambahkan UI dan logika bagi dokter untuk memilih dan menambahkan item obat ke resep.
**File yang Terkena Dampak:**
*   `pages/examination.html`: Menambahkan UI untuk tinjauan resep dan penambahan obat.
*   `scripts/examination.js`: Direfaktor untuk alur kerja status baru, termasuk loop tinjauan stok habis. Memperbaiki bug "keluhan lengket".

---

## 5. Perbaikan & Perombakan Modul Apotek

**Tanggal:** 18 November 2025
**Kategori:** Perbaikan Bug, Refaktor, Fitur
**Deskripsi:** Modul apotek mengalami perbaikan signifikan untuk mendukung alur kerja resep yang baru, termasuk penanganan stok, riwayat, dan integrasi dengan status pembayaran.
*   **Tab Riwayat:** Menambahkan tab "Riwayat" untuk melihat resep yang sudah diserahkan.
*   **Modal Obat:** Meningkatkan modal untuk menambah/mengedit obat agar menyertakan harga dan kategori (`golongan`).
*   **Perbaikan Modal Detail Resep:** Memperbaiki bug di mana tombol tutup modal tidak berfungsi dan daftar item obat kosong.
*   **Logika Tampilan Resep:** **Filter `displayPrescriptions` diubah secara signifikan** untuk menampilkan resep yang relevan bagi apoteker:
    *   Menampilkan resep `pending` (untuk diproses).
    *   Menampilkan resep `pending_doctor_review` (untuk informasi).
    *   **Menampilkan resep `processed` DAN `paid` (untuk diserahkan kepada pasien).**
    *   **Menyembunyikan resep `processed` DAN `unpaid` (karena ini adalah tanggung jawab modul pembayaran).**
*   **Logika Tombol Aksi:** Tombol "Serahkan Obat" sekarang muncul dengan benar untuk resep yang `processed` dan `paid`.
*   **Debugging:** Menambahkan `console.log` di `processPrescription` untuk melacak status resep.
**File yang Terkena Dampak:**
*   `pages/pharmacy.html`: Penambahan tab "Riwayat" dan peningkatan modal.
*   `scripts/pharmacy.js`: Refaktor untuk alur kerja status baru, pengeditan berbasis modal, pencatatan riwayat resep, fitur "laporkan stok habis". Perbaikan bug modal. Modifikasi filter `displayPrescriptions` dan logika tombol aksi.

---

## 6. Perombakan Modul Pembayaran & Fungsionalitas Cetak Struk

**Tanggal:** 18 November 2025
**Kategori:** Perbaikan Bug, Refaktor, Fitur
**Deskripsi:** Modul pembayaran dirombak untuk mendukung pembayaran per-resep, mengatasi bug pembayaran multi-resep, dan menambahkan fungsionalitas cetak struk.
*   **Pembayaran Per-Resep:** Modul pembayaran sekarang menampilkan dan memproses pembayaran untuk **resep individual**, bukan lagi per-pasien. Ini mengatasi bug di mana pasien dengan banyak resep mengalami masalah status pembayaran.
*   **Daftar Resep Dinamis:** Mengganti dropdown pasien dengan daftar dinamis resep yang menunggu pembayaran.
*   **Logika Diskon:** Mengimplementasikan logika diskon berdasarkan status pasien (BPJS, Asuransi, Umum).
*   **Fungsionalitas Cetak Struk:** Menambahkan tombol "Cetak Struk" dan modal struk (`receiptModal`). Mengimplementasikan fungsi `showReceipt`, `closeReceiptModal`, dan `printReceipt` untuk menampilkan dan mencetak detail pembayaran.
*   **Tombol Refresh:** Menambahkan tombol "Refresh" di daftar resep yang menunggu pembayaran untuk memperbarui tampilan secara manual.
*   **Debugging:** Menambahkan `console.log` di `displayPrescriptionsForBilling` untuk melacak data resep yang difilter.
**File yang Terkena Dampak:**
*   `pages/billing.html`: Mengganti dropdown pasien, menambahkan UI rincian biaya, tombol "Cetak Struk", `receiptModal`, dan tombol "Refresh".
*   `scripts/billing.js`: Refaktor untuk pembayaran per-resep, logika diskon, implementasi fungsionalitas cetak struk, dan modifikasi `displayPrescriptionsForBilling`.

---
