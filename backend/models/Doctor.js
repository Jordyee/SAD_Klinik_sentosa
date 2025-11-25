// Doctor Model (Firebase Firestore)
const { getDB, docToObject, snapshotToArray } = require('../config/database');

class Doctor {
    /**
     * Get Firestore collection reference
     */
    static getCollection() {
        const db = getDB();
        return db.collection('doctors');
    }

    /**
     * Generate doctor ID
     */
    static async generateDoctorId() {
        const snapshot = await this.getCollection().count().get();
        const count = snapshot.data().count;
        return 'D' + String(count + 1).padStart(3, '0');
    }

    /**
     * Find all doctors
     */
    static async findAll(activeOnly = true) {
        try {
            let query = this.getCollection();

            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }

            const snapshot = await query.orderBy('nama', 'asc').get();
            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding all doctors:', error);
            throw error;
        }
    }

    /**
     * Find doctor by ID
     */
    static async findById(id) {
        try {
            const doc = await this.getCollection().doc(id).get();
            return docToObject(doc);
        } catch (error) {
            console.error('Error finding doctor by ID:', error);
            throw error;
        }
    }

    /**
     * Find doctor by doctorId (custom field)
     */
    static async findByDoctorId(doctorId) {
        try {
            const snapshot = await this.getCollection()
                .where('doctorId', '==', doctorId)
                .limit(1)
                .get();

            if (snapshot.empty) return null;
            return docToObject(snapshot.docs[0]);
        } catch (error) {
            console.error('Error finding doctor by doctorId:', error);
            throw error;
        }
    }

    /**
     * Find doctor by user ID
     */
    static async findByUserId(userId) {
        try {
            const snapshot = await this.getCollection()
                .where('userId', '==', userId)
                .limit(1)
                .get();

            if (snapshot.empty) return null;
            return docToObject(snapshot.docs[0]);
        } catch (error) {
            console.error('Error finding doctor by userId:', error);
            throw error;
        }
    }

    /**
     * Create new doctor
     */
    static async create(doctorData) {
        try {
            const {
                doctorId,
                nama,
                spesialisasi,
                no_sip,
                email,
                no_telp,
                userId,
                isActive = true
            } = doctorData;

            const finalDoctorId = doctorId || await this.generateDoctorId();

            const newDoctor = {
                doctorId: finalDoctorId,
                nama,
                spesialisasi: spesialisasi || null,
                no_sip: no_sip || null,
                email: email || null,
                no_telp: no_telp || null,
                userId: userId || null,
                isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await this.getCollection().add(newDoctor);

            return {
                id: docRef.id,
                ...newDoctor
            };
        } catch (error) {
            console.error('Error creating doctor:', error);
            throw error;
        }
    }

    /**
     * Update doctor
     */
    static async update(id, doctorData) {
        try {
            const updateData = { ...doctorData };
            updateData.updatedAt = new Date();

            await this.getCollection().doc(id).update(updateData);
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating doctor:', error);
            throw error;
        }
    }

    /**
     * Delete doctor (soft delete)
     */
    static async delete(id) {
        try {
            await this.getCollection().doc(id).update({
                isActive: false,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error deleting doctor:', error);
            return false;
        }
    }

    /**
     * Search doctors by name or specialization
     */
    static async search(query, limit = 20) {
        try {
            // Fetch all active doctors and filter client-side
            const snapshot = await this.getCollection()
                .where('isActive', '==', true)
                .limit(100)
                .get();

            const allDoctors = snapshotToArray(snapshot);
            const searchTerm = query.toLowerCase();

            const results = allDoctors.filter(doctor =>
                doctor.nama?.toLowerCase().includes(searchTerm) ||
                doctor.spesialisasi?.toLowerCase().includes(searchTerm) ||
                doctor.doctorId?.toLowerCase().includes(searchTerm)
            );

            return results.slice(0, limit);
        } catch (error) {
            console.error('Error searching doctors:', error);
            throw error;
        }
    }
}

module.exports = Doctor;
