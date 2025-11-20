// Doctor Model (SQLite with sqlite3)
const { getDB } = require('../config/database');

class Doctor {
    /**
     * Generate doctor ID
     */
    static async generateDoctorId() {
        const db = getDB();
        const result = await db.get('SELECT COUNT(*) as count FROM doctors');
        return 'D' + String(result.count + 1).padStart(3, '0');
    }

    /**
     * Find all doctors
     */
    static async findAll(activeOnly = true) {
        const db = getDB();
        if (activeOnly) {
            return await db.all('SELECT * FROM doctors WHERE isActive = 1 ORDER BY nama ASC');
        }
        return await db.all('SELECT * FROM doctors ORDER BY nama ASC');
    }

    /**
     * Find doctor by ID
     */
    static async findById(id) {
        const db = getDB();
        const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [id]);
        if (doctor) {
            doctor.isActive = Boolean(doctor.isActive);
        }
        return doctor;
    }

    /**
     * Find doctor by doctorId
     */
    static async findByDoctorId(doctorId) {
        const db = getDB();
        const doctor = await db.get('SELECT * FROM doctors WHERE doctorId = ?', [doctorId]);
        if (doctor) {
            doctor.isActive = Boolean(doctor.isActive);
        }
        return doctor;
    }

    /**
     * Create new doctor
     */
    static async create(doctorData) {
        const db = getDB();
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

        const result = await db.run(
            `INSERT INTO doctors (doctorId, nama, spesialisasi, no_sip, email, no_telp, userId, isActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalDoctorId, nama, spesialisasi || null, no_sip || null, email || null, no_telp || null, userId || null, isActive ? 1 : 0]
        );

        // Return result object with lastID
        return result;
    }

    /**
     * Update doctor
     */
    static async update(id, doctorData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (doctorData.nama !== undefined) {
            fields.push('nama = ?');
            values.push(doctorData.nama);
        }
        if (doctorData.spesialisasi !== undefined) {
            fields.push('spesialisasi = ?');
            values.push(doctorData.spesialisasi);
        }
        if (doctorData.no_sip !== undefined) {
            fields.push('no_sip = ?');
            values.push(doctorData.no_sip);
        }
        if (doctorData.email !== undefined) {
            fields.push('email = ?');
            values.push(doctorData.email);
        }
        if (doctorData.no_telp !== undefined) {
            fields.push('no_telp = ?');
            values.push(doctorData.no_telp);
        }
        if (doctorData.userId !== undefined) {
            fields.push('userId = ?');
            values.push(doctorData.userId);
        }
        if (doctorData.isActive !== undefined) {
            fields.push('isActive = ?');
            values.push(doctorData.isActive ? 1 : 0);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Delete doctor (soft delete)
     */
    static async delete(id) {
        const db = getDB();
        const result = await db.run('UPDATE doctors SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        return result.changes > 0;
    }
}

module.exports = Doctor;
