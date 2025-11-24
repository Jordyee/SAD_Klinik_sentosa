// User Model (Firebase Firestore + Firebase Auth)
const { getDB, getAuth, docToObject, snapshotToArray } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Get Firestore collection reference
     */
    static getCollection() {
        const db = getDB();
        return db.collection('users');
    }

    /**
     * Find all users
     */
    static async findAll() {
        try {
            const snapshot = await this.getCollection()
                .orderBy('createdAt', 'desc')
                .get();
            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding all users:', error);
            throw error;
        }
    }

    /**
     * Find user by Firebase UID
     */
    static async findById(uid) {
        try {
            const doc = await this.getCollection().doc(uid).get();
            return docToObject(doc);
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Find user by username (email in Firebase Auth)
     */
    static async findByUsername(username) {
        try {
            const snapshot = await this.getCollection()
                .where('username', '==', username)
                .limit(1)
                .get();

            if (snapshot.empty) return null;
            return docToObject(snapshot.docs[0]);
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        try {
            const auth = getAuth();
            const userRecord = await auth.getUserByEmail(email);

            // Get additional data from Firestore
            const userData = await this.findById(userRecord.uid);

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                ...userData
            };
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return null;
            }
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Create new user (Firebase Auth + Firestore)
     */
    static async create(userData) {
        try {
            const auth = getAuth();
            const {
                username,
                password,
                email,
                role,
                fullName,
                phone,
                isActive = true
            } = userData;

            // Create user in Firebase Authentication
            // Use username as email if no email provided
            const userEmail = email || `${username}@kliniksentosa.local`;

            const userRecord = await auth.createUser({
                email: userEmail,
                password: password,
                displayName: fullName
            });

            // Store additional user data in Firestore
            const firestoreData = {
                username,
                email: userEmail,
                role,
                fullName,
                phone: phone || null,
                isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await this.getCollection().doc(userRecord.uid).set(firestoreData);

            return {
                uid: userRecord.uid,
                ...firestoreData
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    static async update(uid, userData) {
        try {
            const updateData = { ...userData };
            delete updateData.password; // Password updated separately
            delete updateData.email; // Email updated separately
            updateData.updatedAt = new Date();

            await this.getCollection().doc(uid).update(updateData);
            return await this.findById(uid);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update password
     */
    static async updatePassword(uid, newPassword) {
        try {
            const auth = getAuth();
            await auth.updateUser(uid, {
                password: newPassword
            });
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    /**
     * Delete user (soft delete in Firestore, disable in Auth)
     */
    static async delete(uid) {
        try {
            const auth = getAuth();

            // Disable user in Firebase Auth
            await auth.updateUser(uid, {
                disabled: true
            });

            // Soft delete in Firestore
            await this.getCollection().doc(uid).update({
                isActive: false,
                updatedAt: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }

    /**
     * Verify user credentials (for login)
     */
    static async verifyCredentials(username, password) {
        try {
            // Find user by username to get email
            const user = await this.findByUsername(username);

            if (!user) {
                return null;
            }

            // Firebase Auth handles password verification
            // This is typically done on the client side with signInWithEmailAndPassword
            // On server side, we can create a custom token
            const auth = getAuth();
            const customToken = await auth.createCustomToken(user.id);

            return {
                user,
                customToken
            };
        } catch (error) {
            console.error('Error verifying credentials:', error);
            throw error;
        }
    }

    /**
     * Verify Firebase ID token
     */
    static async verifyToken(idToken) {
        try {
            const auth = getAuth();
            const decodedToken = await auth.verifyIdToken(idToken);

            // Get user data from Firestore
            const userData = await this.findById(decodedToken.uid);

            return {
                uid: decodedToken.uid,
                ...userData
            };
        } catch (error) {
            console.error('Error verifying token:', error);
            throw error;
        }
    }

    /**
     * Get users by role
     */
    static async findByRole(role) {
        try {
            const snapshot = await this.getCollection()
                .where('role', '==', role)
                .where('isActive', '==', true)
                .get();

            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding users by role:', error);
            throw error;
        }
    }
}

module.exports = User;
