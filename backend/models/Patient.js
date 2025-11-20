// Patient Model (SQLite with sqlite3)
const { getDB } = require('../config/database');

class Patient {
    /**
     * Generate patient ID
     */
    static async generatePatientId() {
        const db = getDB();
        const result = await db.get('SELECT COUNT(*) as count FROM patients');
        return 'P' + String(result.count + 1).padStart(3, '0');
    }

    /**
     * Find all patients
     */
    static async findAll(orderBy = 'createdAt DESC') {
        const db = getDB();
        const validOrder = ['createdAt DESC', 'createdAt ASC', 'nama ASC', 'nama DESC'];
        const order = validOrder.includes(orderBy) ? orderBy : 'createdAt DESC';
        
        return await db.all(`SELECT * FROM patients ORDER BY ${order}`);
    }

    /**
     * Find patient by ID
     */
    static async findById(id) {
        const db = getDB();
        return await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    }

    /**
     * Find patient by patientId
     */
    static async findByPatientId(patientId) {
        const db = getDB();
        return await db.get('SELECT * FROM patients WHERE patientId = ?', [patientId]);
    }

    /**
     * Create new patient
     */
    static async create(patientData) {
        const db = getDB();
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

        const result = await db.run(
            `INSERT INTO patients (patientId, nama, alamat, no_telp, status_pasien, tanggal_lahir, jenis_kelamin, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalPatientId, nama, alamat, no_telp, status_pasien, tanggal_lahir || null, jenis_kelamin || null, userId || null]
        );

        // Return result object with lastID
        return result;
    }

    /**
     * Update patient
     */
    static async update(id, patientData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (patientData.nama !== undefined) {
            fields.push('nama = ?');
            values.push(patientData.nama);
        }
        if (patientData.alamat !== undefined) {
            fields.push('alamat = ?');
            values.push(patientData.alamat);
        }
        if (patientData.no_telp !== undefined) {
            fields.push('no_telp = ?');
            values.push(patientData.no_telp);
        }
        if (patientData.status_pasien !== undefined) {
            fields.push('status_pasien = ?');
            values.push(patientData.status_pasien);
        }
        if (patientData.tanggal_lahir !== undefined) {
            fields.push('tanggal_lahir = ?');
            values.push(patientData.tanggal_lahir);
        }
        if (patientData.jenis_kelamin !== undefined) {
            fields.push('jenis_kelamin = ?');
            values.push(patientData.jenis_kelamin);
        }
        if (patientData.lastVisit !== undefined) {
            fields.push('lastVisit = ?');
            values.push(patientData.lastVisit);
        }
        if (patientData.userId !== undefined) {
            fields.push('userId = ?');
            values.push(patientData.userId);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Delete patient
     */
    static async delete(id) {
        const db = getDB();
        const result = await db.run('DELETE FROM patients WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Search patients
     */
    static async search(query, limit = 20) {
        const db = getDB();
        const searchTerm = `%${query}%`;
        return await db.all(
            `SELECT * FROM patients 
             WHERE nama LIKE ? OR patientId LIKE ? OR no_telp LIKE ?
             LIMIT ?`,
            [searchTerm, searchTerm, searchTerm, limit]
        );
    }
}

module.exports = Patient;
