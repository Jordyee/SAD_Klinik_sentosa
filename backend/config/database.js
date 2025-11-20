// SQLite Database Configuration (using sqlite3)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Database file path
const DB_PATH = path.join(__dirname, '..', 'klinik.db');

let db = null;

/**
 * Promisify database methods
 */
function promisifyDB(database) {
    return {
        run: promisify(database.run.bind(database)),
        get: promisify(database.get.bind(database)),
        all: promisify(database.all.bind(database)),
        exec: promisify(database.exec.bind(database)),
        close: promisify(database.close.bind(database))
    };
}

/**
 * Initialize and connect to SQLite database
 */
async function connectDB() {
    return new Promise((resolve, reject) => {
        try {
            // Create database directory if it doesn't exist
            const dbDir = path.dirname(DB_PATH);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Connect to database
            db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('\n❌ SQLite Database Connection Failed:');
                    console.error(`   Error: ${err.message}\n`);
                    console.error('💡 Troubleshooting:');
                    console.error('   1. Check if database directory is writable');
                    console.error('   2. Verify file permissions');
                    console.error('   3. Check disk space\n');
                    reject(err);
                    return;
                }

                console.log('\n✅ SQLite Database Connected Successfully!');
                console.log(`   Database: ${DB_PATH}`);
                console.log(`   Mode: WAL (Write-Ahead Logging)\n`);

                // Initialize tables
                initializeTables()
                    .then(() => {
                        resolve(db);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });

            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON');
            
            // Enable WAL mode for better concurrency
            db.run('PRAGMA journal_mode = WAL');
        } catch (error) {
            console.error('\n❌ SQLite Database Connection Failed:');
            console.error(`   Error: ${error.message}\n`);
            reject(error);
        }
    });
}

/**
 * Initialize database tables
 */
async function initializeTables() {
    return new Promise((resolve, reject) => {
        const dbPromisified = promisifyDB(db);

        const createTables = async () => {
            try {
                // Users table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT NOT NULL CHECK(role IN ('admin', 'dokter', 'perawat', 'apotek', 'pasien', 'pemilik')),
                        fullName TEXT NOT NULL,
                        email TEXT,
                        phone TEXT,
                        isActive INTEGER DEFAULT 1,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Patients table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS patients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        patientId TEXT UNIQUE NOT NULL,
                        nama TEXT NOT NULL,
                        alamat TEXT NOT NULL,
                        no_telp TEXT NOT NULL,
                        status_pasien TEXT DEFAULT 'umum' CHECK(status_pasien IN ('umum', 'bpjs', 'asuransi')),
                        tanggal_lahir DATE,
                        jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
                        lastVisit DATE DEFAULT CURRENT_DATE,
                        userId INTEGER,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (userId) REFERENCES users(id)
                    )
                `);

                // Doctors table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS doctors (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        doctorId TEXT UNIQUE NOT NULL,
                        nama TEXT NOT NULL,
                        spesialisasi TEXT,
                        no_sip TEXT,
                        email TEXT,
                        no_telp TEXT,
                        userId INTEGER,
                        isActive INTEGER DEFAULT 1,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (userId) REFERENCES users(id)
                    )
                `);

                // Medicines table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS medicines (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        medicineId TEXT UNIQUE NOT NULL,
                        nama TEXT NOT NULL,
                        stok INTEGER NOT NULL DEFAULT 0 CHECK(stok >= 0),
                        harga INTEGER NOT NULL CHECK(harga >= 0),
                        satuan TEXT DEFAULT 'tablet' CHECK(satuan IN ('tablet', 'kapsul', 'botol', 'box', 'strip', 'sachet')),
                        kategori TEXT,
                        expired_date DATE,
                        isActive INTEGER DEFAULT 1,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Appointments table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS appointments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        queueNumber INTEGER NOT NULL,
                        patientId INTEGER NOT NULL,
                        doctorId INTEGER,
                        status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'examining', 'waiting_prescription', 'completed')),
                        appointmentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                        tinggi_badan REAL,
                        berat_badan REAL,
                        tensi_darah TEXT,
                        suhu_badan REAL,
                        keluhan_perawat TEXT,
                        keluhan TEXT,
                        hasil_pemeriksaan TEXT,
                        catatan_dokter TEXT,
                        needsPrescription INTEGER DEFAULT 0,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patientId) REFERENCES patients(id),
                        FOREIGN KEY (doctorId) REFERENCES doctors(id)
                    )
                `);

                // Prescriptions table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS prescriptions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        prescriptionId TEXT UNIQUE NOT NULL,
                        patientId INTEGER NOT NULL,
                        doctorId INTEGER,
                        appointmentId INTEGER,
                        notes TEXT,
                        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'completed')),
                        processedAt DATETIME,
                        processedBy INTEGER,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patientId) REFERENCES patients(id),
                        FOREIGN KEY (doctorId) REFERENCES doctors(id),
                        FOREIGN KEY (appointmentId) REFERENCES appointments(id),
                        FOREIGN KEY (processedBy) REFERENCES users(id)
                    )
                `);

                // Prescription items table
                await dbPromisified.exec(`
                    CREATE TABLE IF NOT EXISTS prescription_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        prescriptionId INTEGER NOT NULL,
                        medicineId INTEGER,
                        medicineName TEXT NOT NULL,
                        quantity INTEGER NOT NULL CHECK(quantity > 0),
                        dosage TEXT,
                        instructions TEXT,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (prescriptionId) REFERENCES prescriptions(id) ON DELETE CASCADE,
                        FOREIGN KEY (medicineId) REFERENCES medicines(id)
                    )
                `);

                // Create indexes for better performance
                await dbPromisified.exec(`
                    CREATE INDEX IF NOT EXISTS idx_patients_patientId ON patients(patientId);
                    CREATE INDEX IF NOT EXISTS idx_patients_no_telp ON patients(no_telp);
                    CREATE INDEX IF NOT EXISTS idx_medicines_medicineId ON medicines(medicineId);
                    CREATE INDEX IF NOT EXISTS idx_appointments_patientId ON appointments(patientId);
                    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
                    CREATE INDEX IF NOT EXISTS idx_prescriptions_patientId ON prescriptions(patientId);
                    CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
                    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
                `);

                console.log('✅ Database tables initialized successfully\n');
                resolve();
            } catch (error) {
                console.error('❌ Error initializing database tables:', error.message);
                reject(error);
            }
        };

        createTables();
    });
}

/**
 * Get database instance
 */
function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return promisifyDB(db);
}

/**
 * Close database connection
 */
async function closeDB() {
    if (db) {
        const dbPromisified = promisifyDB(db);
        await dbPromisified.close();
        db = null;
        console.log('Database connection closed');
    }
}

module.exports = {
    connectDB,
    getDB,
    closeDB,
    DB_PATH
};
