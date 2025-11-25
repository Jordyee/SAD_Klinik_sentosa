// Migration Script: SQLite Users to Firebase Auth & Firestore
// This script migrates existing users from SQLite database to Firebase

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// Import Firebase setup (will be initialized in main function)
let admin, db, auth;

/**
 * Get users from SQLite database
 */
async function getUsersFromSQLite() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '..', 'klinik.db');
        const sqliteDb = new sqlite3.Database(dbPath);

        sqliteDb.all('SELECT * FROM users', [], (err, rows) => {
            sqliteDb.close();

            if (err) {
                reject(err);
                return;
            }

            resolve(rows);
        });
    });
}

/**
 * Migrate a single user to Firebase
 */
async function migrateUser(user) {
    try {
        const {
            username,
            password,
            role,
            fullName,
            email,
            phone,
            isActive
        } = user;

        // Create email from username if not exists
        const userEmail = email || `${username}@kliniksentosa.local`;

        console.log(`   Migrating user: ${username} (${role})...`);

        // Check if user already exists
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(userEmail);
            console.log(`      ℹ️ User already exists in Firebase Auth (${userRecord.uid})`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create new user in Firebase Auth
                // Note: We can't migrate the hashed password directly
                // So we'll set a default password that needs to be reset
                const defaultPassword = `Klinik${role}123!`;

                userRecord = await auth.createUser({
                    email: userEmail,
                    password: defaultPassword,
                    displayName: fullName,
                    disabled: !isActive
                });

                console.log(`      ✅ Created in Firebase Auth (${userRecord.uid})`);
                console.log(`      🔑 Default password: ${defaultPassword}`);
            } else {
                throw error;
            }
        }

        // Check if Firestore document exists
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (!userDoc.exists) {
            // Store additional user data in Firestore
            await db.collection('users').doc(userRecord.uid).set({
                username,
                email: userEmail,
                role,
                fullName,
                phone: phone || null,
                isActive: Boolean(isActive),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log(`      ✅ Created in Firestore`);
        } else {
            console.log(`      ℹ️ Already exists in Firestore`);
        }

        return {
            success: true,
            username,
            uid: userRecord.uid,
            email: userEmail,
            defaultPassword: `Klinik${role}123!`
        };

    } catch (error) {
        console.error(`      ❌ Error migrating ${user.username}:`, error.message);
        return {
            success: false,
            username: user.username,
            error: error.message
        };
    }
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('\n🔄 Starting User Migration from SQLite to Firebase...\n');

    try {
        // Initialize Firebase
        const firebaseConfig = require('../config/database');
        await firebaseConfig.connectDB();
        admin = firebaseConfig.admin;
        db = firebaseConfig.getDB();
        auth = firebaseConfig.getAuth();

        console.log('📊 Fetching users from SQLite...\n');

        // Get all users from SQLite
        const users = await getUsersFromSQLite();
        console.log(`   Found ${users.length} users in SQLite\n`);

        console.log('🔄 Migrating users to Firebase...\n');

        // Migrate each user
        const results = [];
        for (const user of users) {
            const result = await migrateUser(user);
            results.push(result);
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(60) + '\n');

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ Successfully migrated: ${successful.length} users`);
        console.log(`❌ Failed: ${failed.length} users\n`);

        if (successful.length > 0) {
            console.log('📋 Migrated Users (Username → Email → Default Password):');
            console.log('-'.repeat(60));
            successful.forEach(r => {
                console.log(`   ${r.username} → ${r.email}`);
                console.log(`   Default Password: ${r.defaultPassword}\n`);
            });
        }

        if (failed.length > 0) {
            console.log('❌ Failed Users:');
            console.log('-'.repeat(60));
            failed.forEach(r => {
                console.log(`   ${r.username}: ${r.error}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('⚠️  IMPORTANT NOTES:');
        console.log('='.repeat(60));
        console.log('1. Users cannot use their old passwords from SQLite');
        console.log('2. Default passwords have been set (format: Klinik[Role]123!)');
        console.log('3. Users should reset their passwords on first login');
        console.log('4. Usernames are preserved for login compatibility');
        console.log('5. Check Firebase Console to verify all users\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrate();
