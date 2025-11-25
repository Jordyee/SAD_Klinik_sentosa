# Testing Guide - Klinik Sentosa Backend

## Pre-requisites

1. MongoDB running
2. Backend server running (`npm run dev`)
3. Environment variables configured

## Test Scenarios

### 1. Authentication Tests

#### Test 1.1: Register New User
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "test123",
  "role": "pasien",
  "fullName": "Test User"
}
```

**Expected:** Status 201, returns token and user data

#### Test 1.2: Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Expected:** Status 200, returns token

#### Test 1.3: Get Current User (Protected)
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

**Expected:** Status 200, returns user data

### 2. Patient Management Tests

#### Test 2.1: Create Patient
```bash
POST http://localhost:3000/api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama": "John Doe",
  "alamat": "Jl. Test No. 123",
  "no_telp": "081234567890",
  "status_pasien": "umum"
}
```

**Expected:** Status 201, patient created with auto-generated patientId

#### Test 2.2: Get All Patients
```bash
GET http://localhost:3000/api/patients
Authorization: Bearer <token>
```

**Expected:** Status 200, returns array of patients

#### Test 2.3: Search Patients
```bash
GET http://localhost:3000/api/patients/search?q=John
Authorization: Bearer <token>
```

**Expected:** Status 200, returns matching patients

### 3. Medicine Management Tests

#### Test 3.1: Create Medicine
```bash
POST http://localhost:3000/api/medicines
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "nama": "Test Medicine",
  "stok": 100,
  "harga": 10000,
  "satuan": "tablet"
}
```

**Expected:** Status 201, medicine created

#### Test 3.2: Update Stock
```bash
PATCH http://localhost:3000/api/medicines/<medicine_id>/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "quantity": 50,
  "operation": "subtract"
}
```

**Expected:** Status 200, stock updated

### 4. Appointment Tests

#### Test 4.1: Create Appointment
```bash
POST http://localhost:3000/api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "<patient_id>"
}
```

**Expected:** Status 201, appointment created with queue number

#### Test 4.2: Update Vitals
```bash
PATCH http://localhost:3000/api/appointments/<appointment_id>/vitals
Authorization: Bearer <perawat_token>
Content-Type: application/json

{
  "tinggi_badan": 170,
  "berat_badan": 70,
  "tensi_darah": "120/80",
  "suhu_badan": 36.5,
  "keluhan_perawat": "Demam dan sakit kepala"
}
```

**Expected:** Status 200, vitals updated, status changed to "examining"

#### Test 4.3: Update Consultation
```bash
PATCH http://localhost:3000/api/appointments/<appointment_id>/consultation
Authorization: Bearer <dokter_token>
Content-Type: application/json

{
  "doctorId": "<doctor_id>",
  "consultation": {
    "keluhan": "Demam tinggi",
    "hasil_pemeriksaan": "Infeksi saluran pernapasan",
    "catatan_dokter": "Istirahat dan minum obat",
    "needsPrescription": true
  }
}
```

**Expected:** Status 200, consultation updated, status changed to "waiting_prescription"

### 5. Prescription Tests

#### Test 5.1: Create Prescription
```bash
POST http://localhost:3000/api/prescriptions
Authorization: Bearer <dokter_token>
Content-Type: application/json

{
  "patientId": "<patient_id>",
  "doctorId": "<doctor_id>",
  "appointmentId": "<appointment_id>",
  "items": [
    {
      "medicineId": "<medicine_id>",
      "medicineName": "Paracetamol 500mg",
      "quantity": 2,
      "dosage": "3x1 setelah makan"
    }
  ],
  "notes": "Minum setelah makan"
}
```

**Expected:** Status 201, prescription created

#### Test 5.2: Process Prescription
```bash
PATCH http://localhost:3000/api/prescriptions/<prescription_id>/process
Authorization: Bearer <apotek_token>
```

**Expected:** Status 200, prescription processed, stock deducted, appointment status updated

### 6. Error Handling Tests

#### Test 6.1: Unauthorized Access
```bash
GET http://localhost:3000/api/patients
```

**Expected:** Status 401, "Not authorized" message

#### Test 6.2: Invalid Token
```bash
GET http://localhost:3000/api/patients
Authorization: Bearer invalid_token
```

**Expected:** Status 401, "Not authorized" message

#### Test 6.3: Insufficient Stock
```bash
PATCH http://localhost:3000/api/prescriptions/<prescription_id>/process
Authorization: Bearer <apotek_token>
```

With prescription requiring more stock than available.

**Expected:** Status 400, "Insufficient stock" message

## Automated Testing Script

Create a test file `backend/tests/api.test.js` (optional, requires Jest setup):

```javascript
const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
    let authToken;
    
    test('Login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        authToken = res.body.token;
    });
    
    test('Get Patients', async () => {
        const res = await request(app)
            .get('/api/patients')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
```

## Manual Testing Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Can register new user
- [ ] Can login and get token
- [ ] Protected routes require token
- [ ] Can create patient
- [ ] Can search patients
- [ ] Can create medicine
- [ ] Can update stock
- [ ] Can create appointment
- [ ] Can update vitals (perawat)
- [ ] Can update consultation (dokter)
- [ ] Can create prescription
- [ ] Can process prescription (apotek)
- [ ] Stock deducted correctly
- [ ] Role-based access control works
- [ ] Error handling works correctly

## Performance Testing

Test with multiple concurrent requests:
```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 -H "Authorization: Bearer <token>" http://localhost:3000/api/patients
```

## Security Testing

1. Test SQL injection (should be safe with Mongoose)
2. Test XSS in input fields
3. Test token expiration
4. Test role-based access
5. Test CORS configuration

