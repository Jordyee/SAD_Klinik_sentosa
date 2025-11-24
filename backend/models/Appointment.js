// Appointment Model (Firebase Firestore)
const { getDB, docToObject, snapshotToArray } = require('../config/database');

class Appointment {
    /**
     * Get Firestore collection reference
     */
    static getCollection() {
        const db = getDB();
        return db.collection('appointments');
    }

    /**
     * Generate queue number for today
     */
    static async generateQueueNumber() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const snapshot = await this.getCollection()
            .where('appointmentDate', '>=', today)
            .where('appointmentDate', '<', tomorrow)
            .count()
            .get();

        return snapshot.data().count + 1;
    }

    /**
     * Find all appointments
     */
    static async findAll(orderBy = 'appointmentDate', direction = 'desc') {
        try {
            const snapshot = await this.getCollection()
                .orderBy(orderBy, direction)
                .get();
            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding all appointments:', error);
            throw error;
        }
    }

    /**
     * Find appointment by ID
     */
    static async findById(id) {
        try {
            const doc = await this.getCollection().doc(id).get();
            return docToObject(doc);
        } catch (error) {
            console.error('Error finding appointment by ID:', error);
            throw error;
        }
    }

    /**
     * Find appointments by patient ID
     */
    static async findByPatientId(patientId) {
        try {
            const snapshot = await this.getCollection()
                .where('patientId', '==', patientId)
                .orderBy('appointmentDate', 'desc')
                .get();
            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding appointments by patient ID:', error);
            throw error;
        }
    }

    /**
     * Find today's appointments
     */
    static async findToday() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const snapshot = await this.getCollection()
                .where('appointmentDate', '>=', today)
                .where('appointmentDate', '<', tomorrow)
                .orderBy('appointmentDate', 'asc')
                .get();

            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding today appointments:', error);
            throw error;
        }
    }

    /**
     * Find appointments by status
     */
    static async findByStatus(status) {
        try {
            const snapshot = await this.getCollection()
                .where('status', '==', status)
                .orderBy('appointmentDate', 'desc')
                .get();
            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error finding appointments by status:', error);
            throw error;
        }
    }

    /**
     * Create new appointment
     */
    static async create(appointmentData) {
        try {
            const queueNumber = await this.generateQueueNumber();

            const newAppointment = {
                queueNumber,
                patientId: appointmentData.patientId,
                patientName: appointmentData.patientName || null,
                doctorId: appointmentData.doctorId || null,
                doctorName: appointmentData.doctorName || null,
                status: appointmentData.status || 'waiting',
                appointmentDate: appointmentData.appointmentDate || new Date(),
                tinggi_badan: appointmentData.tinggi_badan || null,
                berat_badan: appointmentData.berat_badan || null,
                tensi_darah: appointmentData.tensi_darah || null,
                suhu_badan: appointmentData.suhu_badan || null,
                keluhan_perawat: appointmentData.keluhan_perawat || null,
                keluhan: appointmentData.keluhan || null,
                hasil_pemeriksaan: appointmentData.hasil_pemeriksaan || null,
                catatan_dokter: appointmentData.catatan_dokter || null,
                needsPrescription: appointmentData.needsPrescription || false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await this.getCollection().add(newAppointment);

            return {
                id: docRef.id,
                ...newAppointment
            };
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    /**
     * Update appointment
     */
    static async update(id, appointmentData) {
        try {
            const updateData = { ...appointmentData };
            updateData.updatedAt = new Date();

            await this.getCollection().doc(id).update(updateData);
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    /**
     * Update appointment status
     */
    static async updateStatus(id, status) {
        try {
            await this.getCollection().doc(id).update({
                status,
                updatedAt: new Date()
            });
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating appointment status:', error);
            throw error;
        }
    }

    /**
     * Delete appointment
     */
    static async delete(id) {
        try {
            await this.getCollection().doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            return false;
        }
    }

    /**
     * Get queue statistics for today
     */
    static async getTodayStats() {
        try {
            const todayAppointments = await this.findToday();

            const stats = {
                total: todayAppointments.length,
                waiting: todayAppointments.filter(a => a.status === 'waiting').length,
                examining: todayAppointments.filter(a => a.status === 'examining').length,
                waiting_prescription: todayAppointments.filter(a => a.status === 'waiting_prescription').length,
                completed: todayAppointments.filter(a => a.status === 'completed').length
            };

            return stats;
        } catch (error) {
            console.error('Error getting today stats:', error);
            throw error;
        }
    }
}

module.exports = Appointment;
