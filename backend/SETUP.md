# Setup Guide - Klinik Sentosa Backend

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
# Copy .env.example to .env
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Edit `.env` file:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/klinik_sentosa
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
```

### 3. Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Or run manually:**
```bash
mongod
```

### 4. Seed Demo Data (Optional)
```bash
node scripts/seedData.js
```

This will create:
- Demo users (admin, dokter, perawat, apotek, pasien)
- Sample patients
- Sample medicines
- Sample doctors

### 5. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3000`

## Testing API

### Using Browser Console

1. Open browser console
2. Test login:
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log);
```

### Using Postman/Thunder Client

1. **Login:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **Get Patients (with token):**
   - Method: GET
   - URL: `http://localhost:3000/api/patients`
   - Headers:
     ```
     Authorization: Bearer <token_from_login>
     ```

## Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running: `mongosh` or `mongo`
- Verify MONGODB_URI in .env
- Check MongoDB logs

### Port Already in Use
- Change PORT in .env
- Or kill process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:3000 | xargs kill
  ```

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

## Next Steps

1. ✅ Backend is running
2. Update frontend to use API (see `scripts/api.js`)
3. Test all endpoints
4. Deploy to production

