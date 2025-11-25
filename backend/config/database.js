// Firebase Database Configuration
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db = null;
let auth = null;

/**
 * Initialize Firebase Admin SDK
 */
async function connectDB() {
    try {
        // Get Firebase config path from environment or default
        const configPath = process.env.FIREBASE_CONFIG_PATH || path.join(__dirname, 'firebase-config.json');
        
        // Check if config file exists
        if (!fs.existsSync(configPath)) {
            throw new Error(
                `Firebase config file not found at: ${configPath}\n\n` +
                'Please follow these steps:\n' +
                '1. Go to Firebase Console (https://console.firebase.google.com)\n' +
                '2. Select your project\n' +
                '3. Go to Project Settings > Service Accounts\n' +
                '4. Click "Generate New Private Key"\n' +
                '5. Save the file as "firebase-config.json" in backend/config/\n\n' +
                'See FIREBASE_SETUP.md for detailed instructions.'
            );
        }

        // Read service account key
        const serviceAccount = require(configPath);

        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        // Get Firestore instance
        db = admin.firestore();
        
        // Get Auth instance
        auth = admin.auth();

        // Configure Firestore settings
        db.settings({
            timestampsInSnapshots: true
        });

        console.log('\n✅ Firebase initialized successfully!');
        console.log(`   Project ID: ${serviceAccount.project_id}`);
        console.log(`   Database: Cloud Firestore`);
        console.log(`   Authentication: Firebase Auth\n`);

        return db;
    } catch (error) {
        console.error('\n❌ Firebase Initialization Failed:');
        console.error(`   Error: ${error.message}\n`);
        
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error('💡 Troubleshooting:');
            console.error('   1. Make sure firebase-admin is installed: npm install firebase-admin');
            console.error('   2. Check if firebase-config.json exists in backend/config/\n');
        }
        
        throw error;
    }
}

/**
 * Get Firestore database instance
 */
function getDB() {
    if (!db) {
        throw new Error('Firebase not initialized. Call connectDB() first.');
    }
    return db;
}

/**
 * Get Firebase Auth instance
 */
function getAuth() {
    if (!auth) {
        throw new Error('Firebase not initialized. Call connectDB() first.');
    }
    return auth;
}

/**
 * Close database connection (for Firebase, just null the references)
 */
async function closeDB() {
    if (db || auth) {
        db = null;
        auth = null;
        console.log('Firebase connection closed');
    }
}

/**
 * Helper function to convert Firestore timestamp to Date
 */
function timestampToDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return null;
    return timestamp.toDate();
}

/**
 * Helper function to convert Firestore document to object
 */
function docToObject(doc) {
    if (!doc.exists) return null;
    return {
        id: doc.id,
        ...doc.data()
    };
}

/**
 * Helper function to convert Firestore query snapshot to array
 */
function snapshotToArray(snapshot) {
    const results = [];
    snapshot.forEach(doc => {
        results.push({
            id: doc.id,
            ...doc.data()
        });
    });
    return results;
}

module.exports = {
    connectDB,
    getDB,
    getAuth,
    closeDB,
    timestampToDate,
    docToObject,
    snapshotToArray,
    admin // Export admin for advanced usage
};
