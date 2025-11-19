# Klinik Sentosa - Changelog

Dokumen ini merangkum semua perubahan, perbaikan bug, dan penambahan fitur yang telah dilakukan pada aplikasi web Klinik Sentosa. Tujuannya adalah untuk memberikan konteks yang komprehensif bagi pengembang atau agen di masa mendatang untuk memahami evolusi proyek dan fungsionalitasnya.

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
