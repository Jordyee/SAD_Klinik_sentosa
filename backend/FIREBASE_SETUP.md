# Firebase Setup Guide

Panduan lengkap untuk setup Firebase untuk Sistem Klinik Sentosa.

## 1. Membuat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik **"Add project"** atau **"Tambahkan project"**
3. Masukkan nama project: `klinik-sentosa` (atau nama sesuai keinginan)
4. Disable Google Analytics (opsional, bisa diaktifkan nanti)
5. Klik **"Create project"**

## 2. Enable Firebase Authentication

1. Di Firebase Console, klik **"Authentication"** di menu kiri
2. Klik tab **"Sign-in method"**
3. Enable **"Email/Password"** provider:
   - Klik "Email/Password"
   - Toggle ke "Enable"
   - Klik "Save"

## 3. Enable Cloud Firestore

1. Di Firebase Console, klik **"Firestore Database"** di menu kiri
2. Klik **"Create database"**
3. Pilih **"Start in production mode"** (kita akan set rules nanti)
4. Pilih lokasi server: **asia-southeast1** (Singapore) untuk latency terbaik
5. Klik **"Enable"**

## 4. Setup Firestore Security Rules

Di tab **"Rules"**, ganti dengan rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function untuk check authentication
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function untuk check role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Users collection - hanya user sendiri yang bisa read/write
    match /users/{userId} {
      allow read: if isSignedIn() && request.auth.uid == userId;
      allow write: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Patients collection
    match /patients/{patientId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && getUserRole() in ['admin', 'pasien'];
      allow update, delete: if isSignedIn() && getUserRole() in ['admin'];
    }
    
    // Medicines collection
    match /medicines/{medicineId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && getUserRole() in ['admin', 'apotek'];
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && getUserRole() in ['admin', 'pasien'];
      allow update: if isSignedIn() && getUserRole() in ['admin', 'perawat', 'dokter'];
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }
    
    // Prescriptions collection (dengan subcollections)
    match /prescriptions/{prescriptionId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && getUserRole() in ['dokter'];
      allow update: if isSignedIn() && getUserRole() in ['dokter', 'apotek'];
      allow delete: if isSignedIn() && getUserRole() == 'admin';
      
      // Prescription items subcollection
      match /items/{itemId} {
        allow read, write: if isSignedIn();
      }
    }
    
    // Doctors collection
    match /doctors/{doctorId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
  }
}
```

## 5. Generate Service Account Key (untuk Backend)

1. Di Firebase Console, klik ikon **gear/settings** → **"Project settings"**
2. Klik tab **"Service accounts"**
3. Klik **"Generate new private key"**
4. Klik **"Generate key"** pada dialog konfirmasi
5. File JSON akan terdownload otomatis
6. **PENTING**: Rename file menjadi `firebase-config.json`
7. Copy file ke folder `backend/config/firebase-config.json`
8. **PENTING**: Jangan commit file ini ke Git (sudah ada di .gitignore)

## 6. Dapatkan Firebase Config untuk Frontend

1. Di Firebase Console → **Project settings** → tab **"General"**
2. Scroll ke bawah ke section **"Your apps"**
3. Klik icon **Web** (`</>`) untuk "Add Firebase to your web app"
4. Masukkan nickname: `klinik-sentosa-web`
5. Centang **"Also set up Firebase Hosting"** (opsional)
6. Klik **"Register app"**
7. Copy konfigurasi yang muncul, contoh:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "klinik-sentosa.firebaseapp.com",
  projectId: "klinik-sentosa",
  storageBucket: "klinik-sentosa.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

8. Simpan config ini, akan digunakan di frontend (`scripts/firebase-config.js`)

## 7. Setup Environment Variables

Edit file `backend/.env` dan tambahkan:

```env
# Firebase Configuration
FIREBASE_CONFIG_PATH=./config/firebase-config.json
```

## 8. Install Dependencies

### Backend
```bash
cd backend
npm install firebase-admin
```

### Frontend
Tidak perlu install, akan menggunakan Firebase SDK dari CDN.

## 9. Verify Setup

Test koneksi Firebase dengan menjalankan:

```bash
cd backend
npm run dev
```

Server akan mencoba connect ke Firebase. Jika berhasil, akan muncul log:
```
✅ Firebase initialized successfully!
```

## 10. Migrate Users dari SQLite

Setelah setup selesai, jalankan migration script:

```bash
cd backend
node scripts/migrate-users.js
```

Script ini akan:
- Read semua users dari SQLite database
- Create Firebase Auth accounts dengan email/password
- Simpan user data (role, fullName) ke Firestore collection `users`

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
- Jalankan: `npm install firebase-admin`

### Error: "ENOENT: no such file or directory 'firebase-config.json'"
- Pastikan file service account key sudah di-download dan disimpan di `backend/config/firebase-config.json`

### Error: "Permission denied" saat akses Firestore
- Check Firestore Security Rules di Firebase Console
- Pastikan rules sudah di-deploy

### Error: "auth/email-already-exists" saat migration
- User dengan email tersebut sudah ada di Firebase Auth
- Hapus user di Firebase Console → Authentication atau skip user tersebut

## Collection Structure di Firestore

Setelah setup selesai, structure Firestore akan seperti ini:

```
klinik-sentosa (Database)
├── users/
│   └── {uid}/
│       ├── email: string
│       ├── role: string (admin|dokter|perawat|apotek|pasien|pemilik)
│       ├── fullName: string
│       ├── phone: string
│       ├── isActive: boolean
│       └── createdAt: timestamp
├── patients/
│   └── {patientId}/
├── medicines/
│   └── {medicineId}/
├── appointments/
│   └── {appointmentId}/
├── prescriptions/
│   └── {prescriptionId}/
│       └── items/ (subcollection)
└── doctors/
    └── {doctorId}/
```

## Next Steps

Setelah Firebase setup selesai:
1. ✅ Migrate users dengan script
2. Test login di frontend
3. Test CRUD operations untuk semua modules
4. Monitor data di Firebase Console

---

**Security Reminder**: 
- **JANGAN** commit `firebase-config.json` ke Git
- **JANGAN** share API keys atau service account key
- Gunakan environment variables untuk sensitive data
