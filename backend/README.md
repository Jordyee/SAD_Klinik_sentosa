# Backend Setup - Klinik Sentosa (Firebase)

Backend API untuk Sistem Informasi Klinik Sentosa menggunakan **Firebase Firestore** dan **Firebase Authentication**.

## 🔥 Teknologi Stack

- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore (NoSQL Cloud Database)
- **Authentication**: Firebase Authentication
- **API**: RESTful API
- **Validation**: express-validator
- **Security**: CORS, JWT (via Firebase Auth)

## 📋 Prasyarat

- Node.js >= 14.x
- npm >= 6.x
- Akun Firebase (Free tier sudah cukup untuk development)

## 🚀 Setup Firebase

Sebelum menjalankan backend, Anda harus setup Firebase project terlebih dahulu:

**📚 Ikuti panduan lengkap di: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

Ringkasan langkah:
1. Buat Firebase project di [Firebase Console](https://console.firebase.google.com)
2. Enable Firebase Authentication (Email/Password)
3. Enable Cloud Firestore Database
4. Download service account key → simpan sebagai `config/firebase-config.json`
5. Dapatkan Firebase web config untuk frontend

## 📦 Instalasi

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

File `.env` sudah ada, tapi boleh disesuaikan jika perlu:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Origins (comma-separated)
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500

# Firebase Configuration
FIREBASE_CONFIG_PATH=./config/firebase-config.json
```

### 3. Dapatkan Firebase Service Account Key

- Ikuti instruksi di [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) section 5
- Download file JSON dan simpan ke `backend/config/firebase-config.json`
- **PENTING**: File ini sudah di-gitignore, jangan di-commit!

## 🗄️ Migrasi Data Users

Jika Anda punya data users di SQLite database lama, migrate ke Firebase:

```bash
npm run migrate-users
# atau
node scripts/migrate-users.js
```

Script ini akan:
- Membaca semua users dari SQLite `klinik.db`
- Membuat Firebase Auth accounts untuk setiap user
- Simpan additional data (role, fullName) ke Firestore
- Set default password untuk setiap user

**⚠️ Default Passwords:**
- Format: `Klinik[Role]123!`
- Contoh:
  - admin → `KlinikAdmin123!`
  - dokter → `KlinikDokter123!`
  - perawat → `KlinikPerawat123!`

Users harus reset password saat first login!

## ▶️ Menjalankan Server

### Development Mode (dengan auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## ✅ Verifikasi Setup

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Response seharusnya:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-24T...",
  "database": {
    "status": "connected",
    "type": "Firebase Firestore",
    "authentication": "Firebase Auth"
  }
}
```

### 2. Check Firebase Console

- Buka [Firebase Console](https://console.firebase.google.com)
- Pilih project Anda
- Check **Authentication** → Seharusnya ada users (jika sudah migrate)
- Check **Firestore Database** → Seharusnya ada collection `users`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/search?q=` - Search patients

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/:id` - Update medicine
- `PUT /api/medicines/:id/stock` - Update stock
- `DELETE /api/medicines/:id` - Delete medicine (soft)

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `GET /api/appointments/today` - Get today's queue
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID
- `GET /api/prescriptions/pending` - Get pending prescriptions
- `POST /api/prescriptions` - Create new prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor (soft)

## 🔒 Security

### Firebase Security Rules

Firestore Security Rules sudah diset di Firebase Console untuk:
- Role-based access control (RBAC)
- Data privacy (users hanya bisa read data mereka sendiri)
- Write protection berdasarkan role

Lihat [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) section 4 untuk rules lengkap.

### CORS

CORS sudah dikonfigurasi untuk allow requests dari:
- `http://localhost:5500`
- `http://127.0.0.1:5500`

Tambahkan origin lain di `.env` jika perlu.

## 🧪 Testing

```bash
npm test
```

## 📁 Struktur Project

```
backend/
├── config/
│   ├── database.js              # Firebase Admin SDK initialization
│   └── firebase-config.json     # Firebase service account key (gitignored)
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── patientController.js     # Patient CRUD
│   ├── medicineController.js    # Medicine CRUD
│   ├── appointmentController.js # Appointment CRUD
│   ├── prescriptionController.js# Prescription CRUD
│   └── doctorController.js      # Doctor CRUD
├── middleware/
│   ├── auth.js                  # Auth middleware
│   └── errorHandler.js          # Error handling
├── models/
│   ├── Patient.js               # Patient model (Firestore)
│   ├── Medicine.js              # Medicine model (Firestore)
│   ├── Appointment.js           # Appointment model (Firestore)
│   ├── Prescription.js          # Prescription model (Firestore)
│   ├── Doctor.js                # Doctor model (Firestore)
│   └── User.js                  # User model (Firebase Auth + Firestore)
├── routes/
│   ├── auth.js                  # Auth routes
│   ├── patients.js              # Patient routes
│   ├── medicines.js             # Medicine routes
│   ├── appointments.js          # Appointment routes
│   ├── prescriptions.js         # Prescription routes
│   └── doctors.js               # Doctor routes
├── scripts/
│   └── migrate-users.js         # Migration script SQLite → Firebase
├── utils/
│   └── envSetup.js              # Environment setup utility
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── server.js                    # Server entry point
├── FIREBASE_SETUP.md            # Firebase setup guide
└── README.md                    # This file
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "ENOENT: no such file or directory 'firebase-config.json'"
- Download service account key dari Firebase Console
- Simpan di `backend/config/firebase-config.json`
- Ikuti [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Error: "Permission denied" di Firestore
- Check Firestore Security Rules di Firebase Console
- Pastikan rules sudah di-publish
- Coba set rules ke test mode sementara untuk debugging

### Error: "auth/email-already-exists" saat migrate
- User sudah ada di Firebase Auth
- Hapus user di Firebase Console → Authentication atau skip migration

## 📝 Catatan Penting

1. **Firebase Config File**: `firebase-config.json` adalah **SENSITIVE**, jangan commit ke Git!
2. **Default Passwords**: Users yang di-migrate perlu reset password
3. **Firestore Structure**: NoSQL database, berbeda dengan relational SQLite
4. **Real-time**: Firestore mendukung real-time updates (bisa diimplementasikan di frontend)
5. **Quota**: Free tier Firebase punya limits, monitor usage di console

## 🔗 Links

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Developed for**: Sistem Analisis dan Desain (SAD) - Klinik Sentosa
**Database**: Firebase Firestore (Cloud NoSQL Database)
**Authentication**: Firebase Authentication
