// Script to add "pemilik" user to Firebase
// Run this script to create the missing pemilik user account

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../config/firebase-config.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function addPemilikUser() {
    console.log('\n🔄 Adding "pemilik" user to Firebase...\n');

    const userData = {
        username: 'pemilik',
        email: 'pemilik@klinik.com',
        password: 'Klinikpemilik123!',
        role: 'pemilik',
        fullName: 'Pemilik Klinik'
    };

    try {
        // Check if user already exists
        try {
            const existingUser = await auth.getUserByEmail(userData.email);
            console.log(`   ℹ️  User already exists in Firebase Auth (${existingUser.uid})`);

            // Update Firestore data
            await db.collection('users').doc(existingUser.uid).set({
                username: userData.username,
                email: userData.email,
                role: userData.role,
                fullName: userData.fullName,
                phone: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { merge: true });

            console.log(`   ✅ Updated in Firestore\n`);

        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create new user in Firebase Auth
                const userRecord = await auth.createUser({
                    email: userData.email,
                    password: userData.password,
                    displayName: userData.fullName
                });

                console.log(`   ✅ Created in Firebase Auth (${userRecord.uid})`);

                // Create user document in Firestore
                await db.collection('users').doc(userRecord.uid).set({
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    fullName: userData.fullName,
                    phone: null,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                console.log(`   ✅ Created in Firestore\n`);
            } else {
                throw error;
            }
        }

        console.log('============================================================');
        console.log('SUCCESS - Pemilik User Added!');
        console.log('============================================================\n');
        console.log('📋 User Details:');
        console.log(`   Username: ${userData.username}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Full Name: ${userData.fullName}\n`);

        console.log('✅ You can now login with:');
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}\n`);

    } catch (error) {
        console.error('\n❌ Error adding pemilik user:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run the function
addPemilikUser();
