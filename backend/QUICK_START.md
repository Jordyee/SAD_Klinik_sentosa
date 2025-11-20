# Quick Start - 5 Minutes Setup

## Step 1: Install Dependencies (1 min)
```bash
cd backend
npm install
```

## Step 2: Setup Environment (30 sec)
Create `.env` file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/klinik_sentosa
JWT_SECRET=my_secret_key_123
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5500
```

## Step 3: Start MongoDB (1 min)
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
# atau
mongod
```

## Step 4: Seed Demo Data (30 sec)
```bash
node scripts/seedData.js
```

## Step 5: Start Server (30 sec)
```bash
npm run dev
```

## Step 6: Test (1 min)

Open browser console and test:
```javascript
// Test login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(r => r.json())
.then(data => {
  console.log('Login success:', data);
  // Save token
  localStorage.setItem('token', data.token);
});
```

## ✅ Done!

Backend is running on `http://localhost:3000`

**Demo Accounts:**
- admin / admin123
- dokter / dokter123
- perawat / perawat123
- apotek / apotek123
- pasien / pasien123

## Next Steps

1. Test API endpoints (see TESTING.md)
2. Integrate with frontend (see scripts/api.js)
3. Deploy to production

