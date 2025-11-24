# Sistem Analisis dan Desain - Entity-Relationship Diagram (ERD)

Dokumen ini mendefinisikan struktur data untuk Sistem Informasi Klinik Sentosa, yang dianalisis dari prototipe aplikasi.

## 1. Diagram Entitas-Relasi (Representasi Teks)

```
[Pasien] (1) -- (N) [Kunjungan]
   |
   +-- (Atribut: pasien_id (PK), nama, alamat, no_telp, tanggal_lahir, jenis_kelamin, status_pasien)

[Kunjungan] (1) -- (1) [Pemeriksaan]
     |
     +-- (Atribut: kunjungan_id (PK), pasien_id (FK), tanggal_kunjungan, status_antrian)
     |
     +-- (1) -- (1) [Pembayaran]

[Pengguna] (1) -- (N) [Pemeriksaan]  // Sebagai Dokter/Perawat
     |
     +-- (Atribut: user_id (PK), username, password, email, role)

[Pemeriksaan] (1) -- (0..1) [Resep]
     |
     +-- (Atribut: pemeriksaan_id (PK), kunjungan_id (FK), dokter_id (FK), perawat_id (FK), ..., hasil_pemeriksaan)

[Resep] (N) -- (M) [Obat] (melalui Detail_Resep)
   |
   +-- (Atribut: resep_id (PK), pemeriksaan_id (FK), tanggal_resep, status)

[Detail_Resep] // Tabel Junction
   |
   +-- (Atribut: resep_id (FK), obat_id (FK), jumlah)

[Obat]
   |
   +-- (Atribut: obat_id (PK), nama_obat, golongan, stok, harga)

[Pembayaran]
   |
   +-- (Atribut: pembayaran_id (PK), kunjungan_id (FK), total_biaya, metode_pembayaran, status)

```

## 2. Deskripsi Entitas dan Atribut

### **Entitas: `Pasien`**
Menyimpan data demografis setiap pasien.
- **pasien_id (PK)**: Identifier unik untuk setiap pasien.
- **nama**: Nama lengkap pasien.
- **alamat**: Alamat tempat tinggal pasien.
- **no_telp**: Nomor telepon yang bisa dihubungi.
- **tanggal_lahir**: Tanggal lahir pasien (dianalisis dari kebutuhan audit).
- **jenis_kelamin**: Jenis kelamin pasien (dianalisis dari kebutuhan audit).
- **status_pasien**: Status pembiayaan pasien (e.g., 'Umum', 'BPJS', 'Asuransi').

### **Entitas: `Pengguna`**
Menyimpan data akun untuk staf klinik yang dapat mengakses sistem.
- **user_id (PK)**: Identifier unik untuk setiap pengguna.
- **username**: Nama pengguna untuk login.
- **password**: Password yang sudah di-hash.
- **email**: Email pengguna.
- **role**: Peran pengguna dalam sistem (e.g., 'admin', 'dokter', 'perawat', 'apotek', 'pemilik').

### **Entitas: `Kunjungan`**
Mencatat setiap kali pasien datang ke klinik. Entitas ini berfungsi sebagai penghubung utama antar proses.
- **kunjungan_id (PK)**: Identifier unik untuk setiap kunjungan.
- **pasien_id (FK)**: Merujuk ke `Pasien` yang melakukan kunjungan.
- **tanggal_kunjungan**: Tanggal dan waktu kunjungan.
- **status_antrian**: Status pasien dalam alur pelayanan (e.g., 'menunggu', 'pemeriksaan', 'selesai').

### **Entitas: `Pemeriksaan`**
Menyimpan detail rekam medis dari sebuah kunjungan.
- **pemeriksaan_id (PK)**: Identifier unik untuk setiap sesi pemeriksaan.
- **kunjungan_id (FK)**: Merujuk ke `Kunjungan` terkait.
- **dokter_id (FK)**: Merujuk ke `Pengguna` (Dokter) yang melakukan pemeriksaan.
- **perawat_id (FK)**: Merujuk ke `Pengguna` (Perawat) yang mencatat data vital.
- **tinggi_badan, berat_badan, tensi_darah, suhu_badan**: Data vital pasien.
- **keluhan, hasil_pemeriksaan, catatan_dokter**: Detail konsultasi.

### **Entitas: `Obat`**
Katalog semua obat yang tersedia di apotek.
- **obat_id (PK)**: Identifier unik untuk setiap jenis obat.
- **nama_obat**: Nama dagang atau generik obat.
- **golongan**: Kategori obat.
- **stok**: Jumlah stok yang tersedia.
- **harga**: Harga satuan obat.

### **Entitas: `Resep`**
Menyimpan data resep yang dikeluarkan oleh dokter.
- **resep_id (PK)**: Identifier unik untuk setiap resep.
- **pemeriksaan_id (FK)**: Merujuk ke `Pemeriksaan` yang menghasilkan resep ini.
- **tanggal_resep**: Tanggal resep dibuat.
- **catatan_resep**: Instruksi khusus dari dokter untuk apoteker.
- **status**: Status pemrosesan resep (e.g., 'menunggu', 'diproses', 'selesai').

### **Entitas: `Detail_Resep` (Tabel Junction)**
Tabel perantara untuk menangani hubungan Many-to-Many antara `Resep` dan `Obat`.
- **resep_id (FK)**: Merujuk ke `Resep`.
- **obat_id (FK)**: Merujuk ke `Obat`.
- **jumlah**: Jumlah obat yang diresepkan.

### **Entitas: `Pembayaran`**
Mencatat semua transaksi pembayaran.
- **pembayaran_id (PK)**: Identifier unik untuk setiap transaksi.
- **kunjungan_id (FK)**: Merujuk ke `Kunjungan` yang ditagih.
- **total_biaya**: Jumlah total yang harus dibayar.
- **metode_pembayaran**: Cara pembayaran (e.g., 'Tunai', 'Kartu').
- **tanggal_bayar**: Waktu pembayaran dilakukan.
- **status**: Status pembayaran ('Lunas', 'Belum Lunas').

## 3. Deskripsi Relasi

- **Pasien ke Kunjungan (One-to-Many)**: Satu pasien dapat memiliki banyak riwayat kunjungan, tetapi setiap kunjungan hanya milik satu pasien.
- **Kunjungan ke Pemeriksaan (One-to-One)**: Setiap kunjungan menghasilkan tepat satu catatan pemeriksaan.
- **Kunjungan ke Pembayaran (One-to-One)**: Setiap kunjungan memiliki satu catatan pembayaran terkait.
- **Pengguna ke Pemeriksaan (One-to-Many)**: Satu dokter atau perawat dapat melakukan banyak pemeriksaan, tetapi setiap pemeriksaan dicatat oleh satu dokter/perawat spesifik.
- **Pemeriksaan ke Resep (One-to-One, Opsional)**: Sebuah pemeriksaan bisa menghasilkan satu resep atau tidak sama sekali.
- **Resep ke Obat (Many-to-Many)**: Satu resep bisa berisi banyak jenis obat, dan satu jenis obat bisa ada di banyak resep. Relasi ini dijembatani oleh tabel `Detail_Resep`.
