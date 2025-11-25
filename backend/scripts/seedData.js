// Seed Data Script for SQLite
const { connectDB, getDB } = require('../config/database');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// Connect to database and seed
const seedData = async () => {
    try {
        await connectDB();
        const db = getDB();

        console.log('🗑️  Clearing existing data...');
        
        // Clear existing data (in reverse order of dependencies)
        await db.run('DELETE FROM prescription_items');
        await db.run('DELETE FROM prescriptions');
        await db.run('DELETE FROM appointments');
        await db.run('DELETE FROM medicines');
        await db.run('DELETE FROM doctors');
        await db.run('DELETE FROM patients');
        await db.run('DELETE FROM users');
        
        // Reset auto-increment
        await db.run('DELETE FROM sqlite_sequence');
        
        console.log('✅ Existing data cleared.\n');

        console.log('👥 Creating users...');
        
        // Create Users
        const adminUser = await User.create({
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            fullName: 'Administrator',
            email: 'admin@klinik.com',
            phone: '081234567890'
        });

        const dokterUser = await User.create({
            username: 'dokter',
            password: 'dokter123',
            role: 'dokter',
            fullName: 'Dr. Budi Santoso',
            email: 'dokter@klinik.com',
            phone: '081234567891'
        });

        const perawatUser = await User.create({
            username: 'perawat',
            password: 'perawat123',
            role: 'perawat',
            fullName: 'Siti Nurhaliza',
            email: 'perawat@klinik.com',
            phone: '081234567892'
        });

        const apotekUser = await User.create({
            username: 'apotek',
            password: 'apotek123',
            role: 'apotek',
            fullName: 'Ahmad Fauzi',
            email: 'apotek@klinik.com',
            phone: '081234567893'
        });

        const pasienUser = await User.create({
            username: 'pasien',
            password: 'pasien123',
            role: 'pasien',
            fullName: 'John Doe',
            email: 'pasien@example.com',
            phone: '081234567894'
        });

        console.log('✅ Users created.\n');

        console.log('👨‍⚕️ Creating doctors...');
        
        // Create Doctors
        const doctor1Result = await Doctor.create({
            nama: 'Dr. Budi Santoso',
            spesialisasi: 'Dokter Umum',
            no_sip: 'SIP-001',
            email: 'budi.santoso@klinik.com',
            no_telp: '081234567891',
            userId: dokterUser.lastID,
            isActive: true
        });

        const doctor2Result = await Doctor.create({
            nama: 'Dr. Siti Aminah',
            spesialisasi: 'Dokter Anak',
            no_sip: 'SIP-002',
            email: 'siti.aminah@klinik.com',
            no_telp: '081234567895',
            userId: null,
            isActive: true
        });

        console.log('✅ Doctors created.\n');

        console.log('🏥 Creating patients...');
        
        // Create Patients
        const patient1Result = await Patient.create({
            nama: 'Ahmad Wijaya',
            alamat: 'Jl. Merdeka No. 10, Jakarta',
            no_telp: '081111111111',
            status_pasien: 'umum',
            tanggal_lahir: '1990-01-15',
            jenis_kelamin: 'L',
            userId: pasienUser.lastID
        });

        const patient2Result = await Patient.create({
            nama: 'Siti Aminah',
            alamat: 'Jl. Raya No. 25, Bandung',
            no_telp: '082222222222',
            status_pasien: 'bpjs',
            tanggal_lahir: '1985-05-20',
            jenis_kelamin: 'P',
            userId: null
        });

        const patient3Result = await Patient.create({
            nama: 'Budi Santoso',
            alamat: 'Jl. Sudirman No. 50, Surabaya',
            no_telp: '083333333333',
            status_pasien: 'umum',
            tanggal_lahir: '1992-08-10',
            jenis_kelamin: 'L',
            userId: null
        });

        console.log('✅ Patients created.\n');

        console.log('💊 Creating medicines...');
        
        // Create Medicines
        const medicine1Result = await Medicine.create({
            nama: 'Paracetamol 500mg',
            stok: 100,
            harga: 5000,
            satuan: 'tablet',
            kategori: 'Obat Bebas',
            isActive: true
        });

        const medicine2Result = await Medicine.create({
            nama: 'Amoxicillin 500mg',
            stok: 50,
            harga: 15000,
            satuan: 'kapsul',
            kategori: 'Antibiotik',
            isActive: true
        });

        const medicine3Result = await Medicine.create({
            nama: 'Vitamin C 1000mg',
            stok: 75,
            harga: 8000,
            satuan: 'tablet',
            kategori: 'Vitamin',
            isActive: true
        });

        const medicine4Result = await Medicine.create({
            nama: 'Obat Batuk Sirup',
            stok: 30,
            harga: 12000,
            satuan: 'botol',
            kategori: 'Obat Bebas',
            isActive: true
        });

        console.log('✅ Medicines created.\n');

        console.log('📅 Creating appointments...');
        
        // Create Appointments
        const appointment1Result = await Appointment.create({
            patientId: patient1Result.lastID,
            queueNumber: 1
        });

        const appointment2Result = await Appointment.create({
            patientId: patient2Result.lastID,
            queueNumber: 2
        });

        console.log('✅ Appointments created.\n');

        console.log('💉 Creating prescriptions...');
        
        // Create Prescriptions
        const prescription1Result = await Prescription.create({
            patientId: patient1Result.lastID,
            doctorId: doctor1Result.lastID,
            appointmentId: appointment1Result.lastID,
            items: [
                {
                    medicineId: medicine1Result.lastID,
                    medicineName: 'Paracetamol 500mg',
                    quantity: 2,
                    dosage: '3x1 setelah makan',
                    instructions: 'Minum setelah makan'
                },
                {
                    medicineId: medicine3Result.lastID,
                    medicineName: 'Vitamin C 1000mg',
                    quantity: 1,
                    dosage: '1x1 pagi hari',
                    instructions: 'Minum pagi hari'
                }
            ],
            notes: 'Resep untuk demam dan meningkatkan daya tahan tubuh',
            status: 'pending'
        });

        console.log('✅ Prescriptions created.\n');

        console.log('🎉 Database seeded successfully!');
        console.log('\n📋 Demo Accounts:');
        console.log('   Admin:   admin / admin123');
        console.log('   Dokter:  dokter / dokter123');
        console.log('   Perawat: perawat / perawat123');
        console.log('   Apotek:  apotek / apotek123');
        console.log('   Pasien:  pasien / pasien123\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seed
seedData().catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
});
