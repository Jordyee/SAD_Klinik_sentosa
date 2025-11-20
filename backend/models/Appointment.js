// Appointment Model (SQLite with sqlite3)
const { getDB } = require('../config/database');

class Appointment {
    /**
     * Generate queue number for today
     */
    static async generateQueueNumber() {
        const db = getDB();
        const today = new Date().toISOString().split('T')[0];
        const result = await db.get(
            `SELECT COUNT(*) as count FROM appointments 
             WHERE DATE(appointmentDate) = ?`,
            [today]
        );
        return result.count + 1;
    }

    /**
     * Find all appointments
     */
    static async findAll(filters = {}) {
        const db = getDB();
        let sql = `
            SELECT a.*, 
                   p.patientId, p.nama as patientName, p.no_telp as patientPhone,
                   d.doctorId, d.nama as doctorName
            FROM appointments a
            LEFT JOIN patients p ON a.patientId = p.id
            LEFT JOIN doctors d ON a.doctorId = d.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            sql += ' AND a.status = ?';
            params.push(filters.status);
        }

        if (filters.date) {
            sql += ' AND DATE(a.appointmentDate) = ?';
            params.push(filters.date);
        }

        sql += ' ORDER BY a.queueNumber ASC, a.appointmentDate DESC';

        const appointments = await db.all(sql, params);
        
        return appointments.map(appointment => {
            if (appointment) {
                appointment.needsPrescription = Boolean(appointment.needsPrescription);
            }
            return appointment;
        });
    }

    /**
     * Find appointment by ID
     */
    static async findById(id) {
        const db = getDB();
        const appointment = await db.get(
            `SELECT a.*, 
                    p.patientId, p.nama as patientName, p.no_telp as patientPhone,
                    d.doctorId, d.nama as doctorName
             FROM appointments a
             LEFT JOIN patients p ON a.patientId = p.id
             LEFT JOIN doctors d ON a.doctorId = d.id
             WHERE a.id = ?`,
            [id]
        );

        if (appointment) {
            appointment.needsPrescription = Boolean(appointment.needsPrescription);
        }

        return appointment;
    }

    /**
     * Create new appointment
     */
    static async create(appointmentData) {
        const db = getDB();
        const { patientId, queueNumber } = appointmentData;

        const finalQueueNumber = queueNumber || await this.generateQueueNumber();

        const result = await db.run(
            `INSERT INTO appointments (queueNumber, patientId, status)
             VALUES (?, ?, 'waiting')`,
            [finalQueueNumber, patientId]
        );

        // Return result object with lastID
        return result;
    }

    /**
     * Update appointment
     */
    static async update(id, appointmentData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (appointmentData.doctorId !== undefined) {
            fields.push('doctorId = ?');
            values.push(appointmentData.doctorId);
        }
        if (appointmentData.status !== undefined) {
            fields.push('status = ?');
            values.push(appointmentData.status);
        }
        if (appointmentData.queueNumber !== undefined) {
            fields.push('queueNumber = ?');
            values.push(appointmentData.queueNumber);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Update vitals
     */
    static async updateVitals(id, vitalsData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (vitalsData.tinggi_badan !== undefined) {
            fields.push('tinggi_badan = ?');
            values.push(vitalsData.tinggi_badan);
        }
        if (vitalsData.berat_badan !== undefined) {
            fields.push('berat_badan = ?');
            values.push(vitalsData.berat_badan);
        }
        if (vitalsData.tensi_darah !== undefined) {
            fields.push('tensi_darah = ?');
            values.push(vitalsData.tensi_darah);
        }
        if (vitalsData.suhu_badan !== undefined) {
            fields.push('suhu_badan = ?');
            values.push(vitalsData.suhu_badan);
        }
        if (vitalsData.keluhan_perawat !== undefined) {
            fields.push('keluhan_perawat = ?');
            values.push(vitalsData.keluhan_perawat);
        }

        fields.push('status = ?');
        values.push('examining');
        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Update consultation
     */
    static async updateConsultation(id, consultationData) {
        const db = getDB();
        const { doctorId, consultation } = consultationData;
        const fields = [];
        const values = [];

        if (doctorId !== undefined) {
            fields.push('doctorId = ?');
            values.push(doctorId);
        }
        if (consultation.keluhan !== undefined) {
            fields.push('keluhan = ?');
            values.push(consultation.keluhan);
        }
        if (consultation.hasil_pemeriksaan !== undefined) {
            fields.push('hasil_pemeriksaan = ?');
            values.push(consultation.hasil_pemeriksaan);
        }
        if (consultation.catatan_dokter !== undefined) {
            fields.push('catatan_dokter = ?');
            values.push(consultation.catatan_dokter);
        }
        if (consultation.needsPrescription !== undefined) {
            fields.push('needsPrescription = ?');
            values.push(consultation.needsPrescription ? 1 : 0);
        }

        // Update status based on needsPrescription
        const status = consultation.needsPrescription ? 'waiting_prescription' : 'completed';
        fields.push('status = ?');
        values.push(status);
        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }
}

module.exports = Appointment;
