# Klinik Sentosa Backend - SQLite Version

Backend API untuk Sistem Informasi Klinik Sentosa menggunakan Node.js, Express.js, dan **SQLite**.

## Teknologi

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (better-sqlite3)
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Fitur

- ✅ Patient Management (CRUD)
- ✅ Medicine Inventory Management
- ✅ Appointment/Queue System
- ✅ Prescription System
- ✅ Doctor Management
- ✅ JWT Authentication
- ✅ Role-based Access Control

## Instalasi

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

**Automatic Setup (Recommended):**
The server will automatically create a `.env` file with default values if it doesn't exist when you first run it.

**Manual Setup:**
Create `.env` file manually:

```bash
# Create .env file
touch .env  # Mac/Linux
# or create manually on Windows
```

Edit `.env`:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5500
```

**Note:** SQLite database (`klinik.db`) will be created automatically in the `backend/` directory.

### 3. Seed Demo Data (Optional)

```bash
npm run seed
```

This will create:
- Demo users (admin, dokter, perawat, apotek, pasien)
- Sample patients, doctors, medicines
- Sample appointments and prescriptions

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

## Database

- **Type:** SQLite
- **File:** `backend/klinik.db` (auto-created)
- **Tables:** users, patients, doctors, medicines, appointments, prescriptions, prescription_items

## API Endpoints

Base URL: `http://localhost:3000/api`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (Protected)

### Patients
- `GET /patients` - Get all patients (Protected)
- `GET /patients/:id` - Get patient by ID (Protected)
- `POST /patients` - Create patient (Protected)
- `PUT /patients/:id` - Update patient (Protected)
- `DELETE /patients/:id` - Delete patient (Protected, Admin only)
- `GET /patients/search?q=query` - Search patients (Protected)

### Medicines
- `GET /medicines` - Get all medicines (Protected)
- `GET /medicines/:id` - Get medicine by ID (Protected)
- `POST /medicines` - Create medicine (Protected, Admin/Apotek)
- `PUT /medicines/:id` - Update medicine (Protected, Admin/Apotek)
- `DELETE /medicines/:id` - Delete medicine (Protected, Admin/Apotek)
- `PATCH /medicines/:id/stock` - Update stock (Protected, Admin/Apotek)

### Appointments
- `GET /appointments` - Get all appointments (Protected)
- `GET /appointments/:id` - Get appointment by ID (Protected)
- `POST /appointments` - Create appointment (Protected)
- `PUT /appointments/:id` - Update appointment (Protected)
- `PATCH /appointments/:id/vitals` - Update vitals (Protected, Perawat)
- `PATCH /appointments/:id/consultation` - Update consultation (Protected, Dokter)

### Prescriptions
- `GET /prescriptions` - Get all prescriptions (Protected)
- `GET /prescriptions/:id` - Get prescription by ID (Protected)
- `POST /prescriptions` - Create prescription (Protected, Dokter)
- `PATCH /prescriptions/:id/process` - Process prescription (Protected, Apotek)
- `PUT /prescriptions/:id` - Update prescription (Protected, Dokter)

### Doctors
- `GET /doctors` - Get all doctors (Protected)
- `GET /doctors/:id` - Get doctor by ID (Protected)
- `POST /doctors` - Create doctor (Protected, Admin)
- `PUT /doctors/:id` - Update doctor (Protected, Admin)
- `DELETE /doctors/:id` - Delete doctor (Protected, Admin)

## Demo Accounts

After running `npm run seed`:

- **Admin:** `admin` / `admin123`
- **Dokter:** `dokter` / `dokter123`
- **Perawat:** `perawat` / `perawat123`
- **Apotek:** `apotek` / `apotek123`
- **Pasien:** `pasien` / `pasien123`

## Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Patients (with token)
```bash
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema

### Users
- id, username, password, role, fullName, email, phone, isActive, createdAt, updatedAt

### Patients
- id, patientId, nama, alamat, no_telp, status_pasien, tanggal_lahir, jenis_kelamin, lastVisit, userId, createdAt, updatedAt

### Doctors
- id, doctorId, nama, spesialisasi, no_sip, email, no_telp, userId, isActive, createdAt, updatedAt

### Medicines
- id, medicineId, nama, stok, harga, satuan, kategori, expired_date, isActive, createdAt, updatedAt

### Appointments
- id, queueNumber, patientId, doctorId, status, appointmentDate, tinggi_badan, berat_badan, tensi_darah, suhu_badan, keluhan_perawat, keluhan, hasil_pemeriksaan, catatan_dokter, needsPrescription, createdAt, updatedAt

### Prescriptions
- id, prescriptionId, patientId, doctorId, appointmentId, notes, status, processedAt, processedBy, createdAt, updatedAt

### Prescription Items
- id, prescriptionId, medicineId, medicineName, quantity, dosage, instructions, createdAt

## Troubleshooting

### Database file not created
- Check file permissions in `backend/` directory
- Ensure Node.js has write access

### Port already in use
- Change `PORT` in `.env` file
- Or stop the process using port 3000

### JWT Error
- Ensure `JWT_SECRET` is set in `.env`
- Token format: `Bearer <token>`

## Development

Untuk development dengan auto-reload:
```bash
npm run dev
```

## Production

Untuk production:
```bash
npm start
```

## Notes

- SQLite database file (`klinik.db`) is created automatically
- All tables are created automatically on first run
- Foreign keys are enabled for data integrity
- WAL (Write-Ahead Logging) mode is enabled for better concurrency

