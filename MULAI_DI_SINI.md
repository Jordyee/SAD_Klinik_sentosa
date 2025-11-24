# 🔥 INSTRUKSI SETUP FIREBASE - BACA INI DULU!

Sebelum menjalankan aplikasi, Anda **HARUS** setup Firebase terlebih dahulu.

## ⚡ Quick Start (5 Menit)

### Step 1: Buat Firebase Project

1. Buka https://console.firebase.google.com
2. Klik "Add project" / "Tambahkan project"
3. Nama project: `klinik-sentosa` (atau terserah Anda)
4. Disable Google Analytics (opsional)
5. Klik "Create project"

### Step 2: Enable Firebase Services

**2a. Enable Authentication:**
1. Di Firebase Console, klik "Authentication"
2. Klik tab "Sign-in method"
3. Enable "Email/Password" → Toggle On → Save

**2b. Enable Firestore Database:**
1. Klik "Firestore Database"
2. Klik "Create database"
3. Pilih **"Start in production mode"**
4. Pilih location: **asia-southeast1 (Singapore)**
5. Klik "Enable"

### Step 3: Download Service Account Key (PENTING!)

1. Klik ikon gear ⚙️ (Settings) → "Project settings"
2. Klik tab **"Service accounts"**
3. Klik **"Generate new private key"**
4. Klik "Generate key" → File JSON akan terdownload
5. **PENTING**: Rename file menjadi `firebase-config.json`
6. **Copy file ke**: `backend/config/firebase-config.json`

### Step 4: Setup Firestore Security Rules

1. Di Firestore Database, klik tab "Rules"
2. Paste rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    match /users/{userId} {
      allow read: if isSignedIn() && request.auth.uid == userId;
      allow write: if isSignedIn() && request.auth.uid == userId;
    }
    
    match /patients/{patientId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && getUserRole() in ['admin', 'pasien'];
      allow update, delete: if isSignedIn() && getUserRole() in ['admin'];
    }
    
    match /medicines/{medicineId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && getUserRole() in ['admin', 'apotek'];
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }
    
    match /appointments/{appointmentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && getUserRole() in ['admin', 'pasien'];
      allow update: if isSignedIn() && getUserRole() in ['admin', 'perawat', 'dokter'];
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }
    
    match /prescriptions/{prescriptionId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && getUserRole() in ['dokter'];
      allow update: if isSignedIn() && getUserRole() in ['dokter', 'apotek'];
      allow delete: if isSignedIn() && getUserRole() == 'admin';
      
      match /items/{itemId} {
        allow read, write: if isSignedIn();
      }
    }
    
    match /doctors/{doctorId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
  }
}
```

3. Klik **"Publish"**

### Step 5: Dapatkan Firebase Web Config (untuk Frontend)

1. Di Project settings → tab "General"
2. Scroll ke "Your apps"
3. Klik icon Web (`</>`)
4. App nickname: `klinik-sentosa-web`
5. Klik "Register app"
6. **COPY CODE INI** (akan dipakai nanti di frontend):

```javascript
const firebaseConfig = {
  apiKey: "AIza... (COPY INI)",
  authDomain: "klinik-sentosa.firebaseapp.com",
  projectId: "klinik-sentosa",
  storageBucket: "klinik-sentosa.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

Simpan code ini di Notepad untuk digunakan nanti!

---

## ▶️ Menjalankan Backend

Setelah setup Firebase, jalankan:

### 1. Migrate Users dari SQLite ke Firebase

```bash
cd backend
node scripts/migrate-users.js
```

Output akan menampilkan default passwords untuk setiap user.

### 2. Jalankan Server

```bash
npm run dev
```

### 3. Test Server

Buka browser: http://localhost:3000/api/health

Seharusnya muncul:
```json
{
  "success": true,
  "database": {
    "status": "connected",
    "type": "Firebase Firestore"
  }
}
```

---

## ✅ Checklist Setup

- [ ] Firebase project sudah dibuat
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firestore Database enabled
- [ ] Service account key downloaded → saved as `backend/config/firebase-config.json`
- [ ] Firestore Security Rules di-publish
- [ ] Firebase web config di-copy (untuk frontend nanti)
- [ ] Dependencies installed (`npm install` di folder backend)
- [ ] Users migrated (`node scripts/migrate-users.js`)
- [ ] Backend server berjalan (`npm run dev`)
- [ ] Health check OK (http://localhost:3000/api/health)

---

## 🆘 Butuh Help?

Lihat dokumentasi lengkap di:
- `backend/FIREBASE_SETUP.md` - Panduan detail Firebase setup
- `backend/README.md` - Dokumentasi backend API

## ⚠️ PENTING!

1. **JANGAN commit** file `firebase-config.json` ke Git!
2. File ini sudah di-gitignore secara otomatis
3. File ini berisi credentials sensitif

---

**Next Step**: Setelah backend running, lanjutkan setup frontend dengan Firebase Web SDK.
