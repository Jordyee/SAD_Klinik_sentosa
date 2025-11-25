// Patient Model (Firebase Firestore)
const { getDB, docToObject, snapshotToArray } = require('../config/database');

class Patient {
    /**
     * Get Firestore collection reference
     */
    static getCollection() {
        const db = getDB();
        return db.collection('patients');
    }

    /**
     * Generate patient ID
     */
    static async generatePatientId() {
        const snapshot = await this.getCollection().count().get();
        const count = snapshot.data().count;
        return 'P' + String(count + 1).padStart(3, '0');
    }

    /**
     * Find all patients
     */
    static async findAll(orderBy = 'createdAt', direction = 'desc') {
        try {
            const snapshot = await this.getCollection()
                .orderBy(orderBy, direction)
                .get();
            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding all patients:', error);
            throw error;
        }
    }

    /**
     * Find patient by Firestore document ID
     */
    static async findById(id) {
        try {
            const doc = await this.getCollection().doc(id).get();
            return docToObject(doc);
        } catch (error) {
            console.error('Error finding patient by ID:', error);
            throw error;
        }
    }

    /**
     * Find patient by patientId (custom field)
     */
    static async findByPatientId(patientId) {
        try {
            const snapshot = await this.getCollection()
                .where('patientId', '==', patientId)
                .limit(1)
                .get();

            if (snapshot.empty) return null;
            return docToObject(snapshot.docs[0]);
        } catch (error) {
            console.error('Error finding patient by patientId:', error);
            throw error;
        }
    }

    /**
     * Create new patient
     */
    static async create(patientData) {
        try {
            const {
                patientId,
                nama,
                alamat,
                no_telp,
                status_pasien = 'umum',
                tanggal_lahir,
                jenis_kelamin,
                userId
            } = patientData;

            const finalPatientId = patientId || await this.generatePatientId();

            const newPatient = {
                patientId: finalPatientId,
                nama,
                alamat,
                no_telp,
                status_pasien,
                tanggal_lahir: tanggal_lahir || null,
                jenis_kelamin: jenis_kelamin || null,
                userId: userId || null,
                lastVisit: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await this.getCollection().add(newPatient);

            return {
                id: docRef.id,
                ...newPatient
            };
        } catch (error) {
            console.error('Error creating patient:', error);
            throw error;
        }
    }

    /**
     * Update patient
     */
    static async update(id, patientData) {
        try {
            const updateData = { ...patientData };
            updateData.updatedAt = new Date();

            await this.getCollection().doc(id).update(updateData);
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    }

    /**
     * Delete patient
     */
    static async delete(id) {
        try {
            await this.getCollection().doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting patient:', error);
            return false;
        }
    }

    /**
     * Search patients by name, patientId, or phone
     */
    static async search(query, limit = 20) {
        try {
            // Firestore doesn't support full-text search natively
            // We'll need to fetch all and filter client-side for now
            // For production, consider using Algolia or similar service

            const snapshot = await this.getCollection().limit(100).get();
            const allPatients = snapshotToArray(snapshot);

            const searchTerm = query.toLowerCase();
            const results = allPatients.filter(patient =>
                patient.nama?.toLowerCase().includes(searchTerm) ||
                patient.patientId?.toLowerCase().includes(searchTerm) ||
                patient.no_telp?.includes(query)
            );

            return results.slice(0, limit);
        } catch (error) {
            console.error('Error searching patients:', error);
            throw error;
        }
    }

    /**
     * Find patients by phone number (exact match)
     */
    static async findByPhone(phone) {
        try {
            const snapshot = await this.getCollection()
                .where('no_telp', '==', phone)
                .get();

            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding patient by phone:', error);
            throw error;
        }
    }
}

module.exports = Patient;
