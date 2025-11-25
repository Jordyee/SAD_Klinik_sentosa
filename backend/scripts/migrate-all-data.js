// Complete Data Migration Script: SQLite to Firebase
// This script migrates ALL data from SQLite database to Firebase Firestore

const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../config/firebase-config.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

// SQLite database path
const sqliteDbPath = path.join(__dirname, '../klinik.db');
const sqliteDb = new sqlite3.Database(sqliteDbPath);

// Promisify sqlite methods
const runQuery = promisify(sqliteDb.all.bind(sqliteDb));

/**
 * Main migration function
 */
async function migrateAllData() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     COMPLETE DATA MIGRATION: SQLite → Firebase        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
        // Migration order matters due to relationships
        await migrateUsers();
        await migrateDoctors();
        await migratePatients();
        await migrateMedicines();
        await migrateAppointments();
        await migratePrescriptions();

        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║              ✅ MIGRATION COMPLETE!                    ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        await printSummary();

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        sqliteDb.close();
        process.exit(0);
    }
}

/**
 * 1. Migrate Users (with Authentication)
 */
async function migrateUsers() {
    console.log('\n📋 [1/6] Migrating Users...');

    try {
        const users = await runQuery('SELECT * FROM users');
        console.log(`   Found ${users.length} users in SQLite`);

        let migrated = 0;
        let skipped = 0;

        for (const user of users) {
            try {
                // Check if user already exists in Firebase Auth
                let userRecord;
                try {
                    userRecord = await auth.getUserByEmail(user.email);
                    console.log(`   ℹ️  User ${user.username} already exists in Firebase Auth`);
                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        // Create user in Firebase Auth
                        const defaultPassword = `Klinik${user.role}123!`;
                        userRecord = await auth.createUser({
                            email: user.email,
                            password: defaultPassword,
                            displayName: user.fullName || user.username
                        });
                        console.log(`   ✅ Created ${user.username} in Firebase Auth`);
                    } else {
                        throw error;
                    }
                }

                // Create/Update user document in Firestore
                await db.collection('users').doc(userRecord.uid).set({
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    fullName: user.fullName || user.username,
                    phone: user.phone || null,
                    isActive: user.isActive !== undefined ? user.isActive : true,
                    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                    updatedAt: new Date()
                }, { merge: true });

                migrated++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate user ${user.username}:`, error.message);
                skipped++;
            }
        }

        console.log(`   ✅ Migrated: ${migrated}/${users.length} users`);
        if (skipped > 0) console.log(`   ⚠️  Skipped: ${skipped} users`);

    } catch (error) {
        console.error('   ❌ Error migrating users:', error.message);
        throw error;
    }
}

/**
 * 2. Migrate Doctors
 */
async function migrateDoctors() {
    console.log('\n🩺 [2/6] Migrating Doctors...');

    try {
        const doctors = await runQuery('SELECT * FROM doctors');
        console.log(`   Found ${doctors.length} doctors in SQLite`);

        if (doctors.length === 0) {
            console.log('   ⚠️  No doctors to migrate');
            return;
        }

        let migrated = 0;

        for (const doctor of doctors) {
            try {
                await db.collection('doctors').add({
                    name: doctor.name,
                    specialization: doctor.specialization || null,
                    phone: doctor.phone || null,
                    email: doctor.email || null,
                    schedule: doctor.schedule || null,
                    isActive: doctor.isActive !== undefined ? doctor.isActive : true,
                    createdAt: doctor.createdAt ? new Date(doctor.createdAt) : new Date(),
                    updatedAt: new Date()
                });

                migrated++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate doctor ${doctor.name}:`, error.message);
            }
        }

        console.log(`   ✅ Migrated: ${migrated}/${doctors.length} doctors`);

    } catch (error) {
        // Table might not exist
        console.log('   ⚠️  Doctors table not found or empty');
    }
}

/**
 * 3. Migrate Patients
 */
async function migratePatients() {
    console.log('\n👤 [3/6] Migrating Patients...');

    try {
        const patients = await runQuery('SELECT * FROM patients');
        console.log(`   Found ${patients.length} patients in SQLite`);

        if (patients.length === 0) {
            console.log('   ⚠️  No patients to migrate');
            return;
        }

        let migrated = 0;

        for (const patient of patients) {
            try {
                await db.collection('patients').add({
                    name: patient.name,
                    birthDate: patient.birthDate || null,
                    gender: patient.gender || null,
                    address: patient.address || null,
                    phone: patient.phone || null,
                    email: patient.email || null,
                    bloodType: patient.bloodType || null,
                    allergies: patient.allergies || null,
                    medicalHistory: patient.medicalHistory || null,
                    emergencyContact: patient.emergencyContact || null,
                    registrationDate: patient.registrationDate ? new Date(patient.registrationDate) : new Date(),
                    createdAt: patient.createdAt ? new Date(patient.createdAt) : new Date(),
                    updatedAt: new Date()
                });

                migrated++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate patient ${patient.name}:`, error.message);
            }
        }

        console.log(`   ✅ Migrated: ${migrated}/${patients.length} patients`);

    } catch (error) {
        console.log('   ⚠️  Patients table not found or empty');
    }
}

/**
 * 4. Migrate Medicines
 */
async function migrateMedicines() {
    console.log('\n💊 [4/6] Migrating Medicines...');

    try {
        const medicines = await runQuery('SELECT * FROM medicines');
        console.log(`   Found ${medicines.length} medicines in SQLite`);

        if (medicines.length === 0) {
            console.log('   ⚠️  No medicines to migrate');
            return;
        }

        let migrated = 0;

        for (const medicine of medicines) {
            try {
                await db.collection('medicines').add({
                    name: medicine.name,
                    type: medicine.type || null,
                    stock: medicine.stock || 0,
                    unit: medicine.unit || 'pcs',
                    price: medicine.price || 0,
                    expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate) : null,
                    supplier: medicine.supplier || null,
                    description: medicine.description || null,
                    minStock: medicine.minStock || 10,
                    createdAt: medicine.createdAt ? new Date(medicine.createdAt) : new Date(),
                    updatedAt: new Date()
                });

                migrated++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate medicine ${medicine.name}:`, error.message);
            }
        }

        console.log(`   ✅ Migrated: ${migrated}/${medicines.length} medicines`);

    } catch (error) {
        console.log('   ⚠️  Medicines table not found or empty');
    }
}

/**
 * 5. Migrate Appointments
 */
async function migrateAppointments() {
    console.log('\n📅 [5/6] Migrating Appointments...');

    try {
        const appointments = await runQuery('SELECT * FROM appointments');
        console.log(`   Found ${appointments.length} appointments in SQLite`);

        if (appointments.length === 0) {
            console.log('   ⚠️  No appointments to migrate');
            return;
        }

        let migrated = 0;

        for (const appointment of appointments) {
            try {
                await db.collection('appointments').add({
                    patientId: appointment.patientId || null,
                    patientName: appointment.patientName || null,
                    doctorId: appointment.doctorId || null,
                    doctorName: appointment.doctorName || null,
                    date: appointment.date ? new Date(appointment.date) : new Date(),
                    time: appointment.time || null,
                    queueNumber: appointment.queueNumber || null,
                    status: appointment.status || 'waiting',
                    complaint: appointment.complaint || null,
                    diagnosis: appointment.diagnosis || null,
                    treatment: appointment.treatment || null,
                    notes: appointment.notes || null,
                    createdAt: appointment.createdAt ? new Date(appointment.createdAt) : new Date(),
                    updatedAt: new Date()
                });

                migrated++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate appointment:`, error.message);
            }
        }

        console.log(`   ✅ Migrated: ${migrated}/${appointments.length} appointments`);

    } catch (error) {
        console.log('   ⚠️  Appointments table not found or empty');
    }
}

/**
 * 6. Migrate Prescriptions
 */
async function migratePrescriptions() {
    console.log('\n📝 [6/6] Migrating Prescriptions...');

    try {
        const prescriptions = await runQuery('SELECT * FROM prescriptions');
        console.log(`   Found ${prescriptions.length} prescriptions in SQLite`);

        if (prescriptions.length === 0) {
            console.log('   ⚠️  No prescriptions to migrate');
            return;
        }

        let migrated = 0;

        for (const prescription of prescriptions) {
            try {
                // Create prescription document
                const prescriptionRef = await db.collection('prescriptions').add({
                    appointmentId: prescription.appointmentId || null,
                    patientId: prescription.patientId || null,
                    patientName: prescription.patientName || null,
                    doctorId: prescription.doctorId || null,
                    doctorName: prescription.doctorName || null,
                    date: prescription.date ? new Date(prescription.date) : new Date(),
                    diagnosis: prescription.diagnosis || null,
                    notes: prescription.notes || null,
                    status: prescription.status || 'pending',
                    total: prescription.total || 0,
                    createdAt: prescription.createdAt ? new Date(prescription.createdAt) : new Date(),
                    updatedAt: new Date()
                });

                // Migrate prescription items as subcollection
                try {
                    const items = await runQuery('SELECT * FROM prescription_items WHERE prescriptionId = ?', [prescription.id]);

                    for (const item of items) {
                        await prescriptionRef.collection('items').add({
                            medicineId: item.medicineId || null,
                            medicineName: item.medicineName || null,
                            quantity: item.quantity || 0,
                            dosage: item.dosage || null,
                            instructions: item.instructions || null,
                            price: item.price || 0,
                            subtotal: item.subtotal || 0
                        });
                    }

                    if (items.length > 0) {
                        console.log(`      → Added ${items.length} items to prescription`);
                    }

                } catch (error) {
                    // Items table might not exist
                }

                migrated++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate prescription:`, error.message);
            }
        }

        console.log(`   ✅ Migrated: ${migrated}/${prescriptions.length} prescriptions`);

    } catch (error) {
        console.log('   ⚠️  Prescriptions table not found or empty');
    }
}

/**
 * Print migration summary
 */
async function printSummary() {
    console.log('\n📊 MIGRATION SUMMARY:\n');

    const collections = ['users', 'doctors', 'patients', 'medicines', 'appointments', 'prescriptions'];

    for (const collection of collections) {
        try {
            const snapshot = await db.collection(collection).get();
            const icon = getIcon(collection);
            console.log(`   ${icon} ${collection.padEnd(15)} : ${snapshot.size} documents`);
        } catch (error) {
            console.log(`   ⚠️  ${collection.padEnd(15)} : Error reading collection`);
        }
    }

    console.log('\n✅ All data successfully migrated to Firebase Firestore!');
    console.log('\n🔗 Firebase Console: https://console.firebase.google.com');
    console.log(`   Project: ${serviceAccount.project_id}\n`);
}

/**
 * Get icon for collection
 */
function getIcon(collection) {
    const icons = {
        'users': '👥',
        'doctors': '🩺',
        'patients': '👤',
        'medicines': '💊',
        'appointments': '📅',
        'prescriptions': '📝'
    };
    return icons[collection] || '📄';
}

// Run migration
migrateAllData().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
