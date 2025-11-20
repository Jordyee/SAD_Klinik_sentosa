# Klinik Sentosa Backend API

Backend API untuk Sistem Informasi Klinik Sentosa menggunakan Node.js, Express.js, dan MongoDB.

## Teknologi

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
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
npm install
```

### 2. Setup Environment Variables

**Automatic Setup (Recommended):**
The server will automatically create a `.env` file with default values if it doesn't exist when you first run it.

**Manual Setup:**
If you want to customize, create `.env` file manually:

```bash
# Create .env file
touch .env  # Mac/Linux
# or create manually on Windows
```

Edit `.env`:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/klinik_sentosa
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5500
```

**Note:** 
- If `MONGODB_URI` is not set, the server will use default: `mongodb://localhost:27017/klinik_sentosa`
- For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/klinik_sentosa`

### 3. Pastikan MongoDB Running

Pastikan MongoDB sudah terinstall dan running:

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
# atau
mongod
```

### 4. Jalankan Server

**Development mode (dengan auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (Protected)

### Patients
- `GET /api/patients` - Get all patients (Protected)
- `GET /api/patients/:id` - Get single patient (Protected)
- `POST /api/patients` - Create patient (Protected)
- `PUT /api/patients/:id` - Update patient (Protected)
- `DELETE /api/patients/:id` - Delete patient (Admin only)
- `GET /api/patients/search?q=query` - Search patients (Protected)

### Medicines
- `GET /api/medicines` - Get all medicines (Protected)
- `GET /api/medicines/:id` - Get single medicine (Protected)
- `POST /api/medicines` - Create medicine (Admin, Apotek)
- `PUT /api/medicines/:id` - Update medicine (Admin, Apotek)
- `DELETE /api/medicines/:id` - Delete medicine (Admin, Apotek)
- `PATCH /api/medicines/:id/stock` - Update stock (Admin, Apotek)

### Appointments
- `GET /api/appointments` - Get all appointments (Protected)
- `GET /api/appointments/:id` - Get single appointment (Protected)
- `POST /api/appointments` - Create appointment (Protected)
- `PUT /api/appointments/:id` - Update appointment (Protected)
- `PATCH /api/appointments/:id/vitals` - Update vitals (Perawat, Admin)
- `PATCH /api/appointments/:id/consultation` - Update consultation (Dokter, Admin)

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions (Protected)
- `GET /api/prescriptions/:id` - Get single prescription (Protected)
- `POST /api/prescriptions` - Create prescription (Dokter, Admin)
- `PUT /api/prescriptions/:id` - Update prescription (Dokter, Admin)
- `PATCH /api/prescriptions/:id/process` - Process prescription (Apotek, Admin)

### Doctors
- `GET /api/doctors` - Get all doctors (Protected)
- `GET /api/doctors/:id` - Get single doctor (Protected)
- `POST /api/doctors` - Create doctor (Admin)
- `PUT /api/doctors/:id` - Update doctor (Admin)
- `DELETE /api/doctors/:id` - Delete doctor (Admin)

## Authentication

Semua endpoint (kecuali `/api/auth/register` dan `/api/auth/login`) memerlukan authentication token.

### Cara menggunakan:

1. Login untuk mendapatkan token:
```bash
POST /api/auth/login
Body: {
  "username": "dokter",
  "password": "dokter123"
}
```

2. Gunakan token di header:
```
Authorization: Bearer <your_token>
```

## Role-based Access

- **admin** - Full access
- **dokter** - Can create prescriptions, update consultations
- **perawat** - Can update vitals
- **apotek** - Can process prescriptions, manage medicines
- **pasien** - Can view own data
- **pemilik** - View reports (can be extended)

## Testing

### Manual Testing dengan Postman/Thunder Client

1. **Register User:**
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "admin",
  "fullName": "Admin User"
}
```

2. **Login:**
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

3. **Create Patient (dengan token):**
```json
POST http://localhost:3000/api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama": "Ahmad Wijaya",
  "alamat": "Jl. Sudirman No. 123",
  "no_telp": "081234567890",
  "status_pasien": "umum"
}
```

## Struktur Folder

```
backend/
├── config/          # Database configuration
├── controllers/     # Business logic
├── middleware/       # Auth, validation, error handling
├── models/          # Mongoose models
├── routes/          # API routes
├── .env.example     # Environment variables template
├── .gitignore
├── package.json
├── server.js        # Entry point
└── README.md
```

## Troubleshooting

### MongoDB Connection Error

**Error: "uri parameter to openUri() must be a string"**
- ✅ **FIXED:** Server now auto-creates `.env` file if missing
- ✅ **FIXED:** Uses default MONGODB_URI if not set
- Check if `.env` file exists in `backend/` directory
- Verify `MONGODB_URI` is set correctly in `.env`

**Error: "ECONNREFUSED"**
- Make sure MongoDB service is running
- Windows: `net start MongoDB`
- Mac/Linux: `sudo systemctl start mongod`
- Check MongoDB is listening on port 27017

**Error: "Authentication failed"**
- For local MongoDB: Remove auth from connection string
- For MongoDB Atlas: Check username/password and IP whitelist

**For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

### Port Already in Use
- Ubah `PORT` di `.env`
- Atau stop process yang menggunakan port tersebut

### JWT Error
- Pastikan `JWT_SECRET` sudah di-set di `.env` (auto-generated if not set)
- Token harus dikirim dengan format: `Bearer <token>`

### Environment Variables Not Loading
- Server will auto-create `.env` file on first run
- Check `.env` file format (no quotes around values)
- Restart server after modifying `.env`

## Development

Untuk development dengan auto-reload:
```bash
npm run dev
```

Pastikan `nodemon` sudah terinstall sebagai dev dependency.

## Production

1. Set `NODE_ENV=production` di `.env`
2. Gunakan MongoDB Atlas atau production MongoDB
3. Set strong `JWT_SECRET`
4. Setup proper CORS origins
5. Use process manager seperti PM2

```bash
npm install -g pm2
pm2 start server.js --name klinik-api
```

## License

ISC

