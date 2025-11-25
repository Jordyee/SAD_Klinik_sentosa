# Troubleshooting Guide - MongoDB Connection

## Common MongoDB Connection Errors

### 1. "uri parameter to openUri() must be a string"

**Error:**
```
Error: uri parameter to openUri() must be a string
```

**Causes:**
- MONGODB_URI is not set in .env file
- MONGODB_URI is set to empty string
- MONGODB_URI is not a string type

**Solutions:**
1. Check if `.env` file exists in `backend/` directory
2. Verify `MONGODB_URI` is set in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/klinik_sentosa
   ```
3. Make sure there are no quotes around the URI value
4. Restart the server after modifying .env

**Auto-fix:**
The server will now automatically create a `.env` file with default values if it doesn't exist.

---

### 2. "ECONNREFUSED" Error

**Error:**
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Causes:**
- MongoDB service is not running
- MongoDB is running on a different port
- Firewall blocking connection

**Solutions:**

**Windows:**
```bash
# Check if MongoDB service is running
sc query MongoDB

# Start MongoDB service
net start MongoDB

# Or start manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

**Mac (Homebrew):**
```bash
# Check status
brew services list

# Start MongoDB
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
# Check status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Enable auto-start on boot
sudo systemctl enable mongod
```

---

### 3. "Authentication Failed" Error

**Error:**
```
MongoServerError: Authentication failed
```

**Causes:**
- Wrong username/password in connection string
- User doesn't have access to database
- IP address not whitelisted (MongoDB Atlas)

**Solutions:**

**For Local MongoDB:**
1. Remove authentication from connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/klinik_sentosa
   ```

**For MongoDB Atlas:**
1. Check username and password in connection string
2. Verify IP whitelist in MongoDB Atlas dashboard
3. Add `0.0.0.0/0` to allow all IPs (for development only)
4. Check database user permissions

---

### 4. "getaddrinfo ENOTFOUND" Error

**Error:**
```
Error: getaddrinfo ENOTFOUND cluster.mongodb.net
```

**Causes:**
- Invalid MongoDB Atlas cluster URL
- Internet connection issues
- DNS resolution problems

**Solutions:**
1. Verify MongoDB Atlas cluster URL is correct
2. Check internet connection
3. Try pinging the MongoDB Atlas hostname
4. Verify cluster is not paused in MongoDB Atlas dashboard

---

### 5. "Invalid MongoDB URI format"

**Error:**
```
Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://
```

**Causes:**
- Malformed connection string
- Missing protocol prefix

**Solutions:**
1. **Local MongoDB:**
   ```
   mongodb://localhost:27017/klinik_sentosa
   ```

2. **MongoDB Atlas:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/klinik_sentosa?retryWrites=true&w=majority
   ```

3. Make sure URI starts with `mongodb://` or `mongodb+srv://`

---

## Quick Diagnostic Steps

### Step 1: Check .env File
```bash
# Navigate to backend directory
cd backend

# Check if .env exists
dir .env  # Windows
ls -la .env  # Mac/Linux

# View .env content (make sure MONGODB_URI is set)
type .env  # Windows
cat .env  # Mac/Linux
```

### Step 2: Test MongoDB Connection Manually

**Using mongosh (MongoDB Shell):**
```bash
# Connect to local MongoDB
mongosh mongodb://localhost:27017/klinik_sentosa

# Or just
mongosh
```

**Using Node.js:**
```javascript
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/klinik_sentosa')
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Error:', err));
```

### Step 3: Check MongoDB Service Status

**Windows:**
```bash
sc query MongoDB
```

**Mac/Linux:**
```bash
sudo systemctl status mongod
# or
brew services list
```

### Step 4: Check Server Logs

Look for these messages when starting server:
- ✅ `MongoDB Connected Successfully!` - Connection successful
- ❌ `MongoDB Connection Failed:` - Connection failed, check error message
- ⚠️ `MONGODB_URI not set, using default` - Using fallback URI

---

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
- Go to https://www.mongodb.com/cloud/atlas
- Sign up for free account

### 2. Create Cluster
- Choose free tier (M0)
- Select region closest to you
- Wait for cluster to be created

### 3. Get Connection String
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy connection string

### 4. Update .env File
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/klinik_sentosa?retryWrites=true&w=majority
```

Replace:
- `username` with your MongoDB Atlas username
- `password` with your MongoDB Atlas password
- `cluster` with your cluster name

### 5. Whitelist IP Address
- Go to Network Access in MongoDB Atlas
- Add your IP address or `0.0.0.0/0` for development

---

## Environment Variables Reference

### Required Variables
```env
MONGODB_URI=mongodb://localhost:27017/klinik_sentosa
```

### Optional Variables (with defaults)
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=auto_generated_secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5500
```

---

## Still Having Issues?

1. **Check MongoDB Version:**
   ```bash
   mongod --version
   ```

2. **Check Node.js Version:**
   ```bash
   node --version
   ```
   (Requires Node.js 14+)

3. **Check Port Availability:**
   ```bash
   # Windows
   netstat -ano | findstr :27017
   
   # Mac/Linux
   lsof -i :27017
   ```

4. **View Detailed Error:**
   - Check server console output
   - Look for specific error messages
   - Review troubleshooting steps above

5. **Reset Everything:**
   ```bash
   # Delete .env and let it auto-create
   rm .env  # or del .env on Windows
   npm run dev
   ```

---

## Support

If you continue to have issues:
1. Check MongoDB documentation: https://docs.mongodb.com/
2. Check Mongoose documentation: https://mongoosejs.com/docs/
3. Review server logs for specific error messages
4. Verify all prerequisites are installed correctly

