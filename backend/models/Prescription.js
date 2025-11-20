// Prescription Model (SQLite with sqlite3)
const { getDB } = require('../config/database');

class Prescription {
    /**
     * Generate prescription ID
     */
    static async generatePrescriptionId() {
        const db = getDB();
        const result = await db.get('SELECT COUNT(*) as count FROM prescriptions');
        return 'PR' + String(result.count + 1).padStart(3, '0');
    }

    /**
     * Find all prescriptions
     */
    static async findAll(filters = {}) {
        const db = getDB();
        let sql = `
            SELECT pr.*,
                   p.patientId, p.nama as patientName, p.no_telp as patientPhone,
                   d.doctorId, d.nama as doctorName
            FROM prescriptions pr
            LEFT JOIN patients p ON pr.patientId = p.id
            LEFT JOIN doctors d ON pr.doctorId = d.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            sql += ' AND pr.status = ?';
            params.push(filters.status);
        }

        if (filters.patientId) {
            sql += ' AND pr.patientId = ?';
            params.push(filters.patientId);
        }

        sql += ' ORDER BY pr.createdAt DESC';

        const prescriptions = await db.all(sql, params);
        
        // Load items for each prescription
        const prescriptionsWithItems = [];
        for (const prescription of prescriptions) {
            prescription.items = await this.getItems(prescription.id);
            prescriptionsWithItems.push(prescription);
        }
        
        return prescriptionsWithItems;
    }

    /**
     * Find prescription by ID
     */
    static async findById(id) {
        const db = getDB();
        const prescription = await db.get(
            `SELECT pr.*,
                    p.patientId, p.nama as patientName, p.no_telp as patientPhone,
                    d.doctorId, d.nama as doctorName
             FROM prescriptions pr
             LEFT JOIN patients p ON pr.patientId = p.id
             LEFT JOIN doctors d ON pr.doctorId = d.id
             WHERE pr.id = ?`,
            [id]
        );

        if (prescription) {
            prescription.items = await this.getItems(id);
        }

        return prescription;
    }

    /**
     * Get prescription items
     */
    static async getItems(prescriptionId) {
        const db = getDB();
        return await db.all(
            `SELECT pi.*, m.medicineId, m.nama as medicineFullName, m.stok, m.harga
             FROM prescription_items pi
             LEFT JOIN medicines m ON pi.medicineId = m.id
             WHERE pi.prescriptionId = ?`,
            [prescriptionId]
        );
    }

    /**
     * Create new prescription
     */
    static async create(prescriptionData) {
        const db = getDB();
        const { patientId, doctorId, appointmentId, items = [], notes } = prescriptionData;

        const prescriptionId = await this.generatePrescriptionId();

        // Insert prescription
        const result = await db.run(
            `INSERT INTO prescriptions (prescriptionId, patientId, doctorId, appointmentId, notes, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [prescriptionId, patientId, doctorId || null, appointmentId || null, notes || null]
        );

        const prescriptionDbId = result.lastID;

        // Insert prescription items
        if (items.length > 0) {
            for (const item of items) {
                await db.run(
                    `INSERT INTO prescription_items (prescriptionId, medicineId, medicineName, quantity, dosage, instructions)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [prescriptionDbId, item.medicineId || null, item.medicineName, item.quantity, item.dosage || null, item.instructions || null]
                );
            }
        }

        // Update appointment status if provided
        if (appointmentId) {
            await db.run('UPDATE appointments SET status = ? WHERE id = ?', ['waiting_prescription', appointmentId]);
        }

        // Return result object with lastID
        return result;
    }

    /**
     * Update prescription
     */
    static async update(id, prescriptionData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (prescriptionData.doctorId !== undefined) {
            fields.push('doctorId = ?');
            values.push(prescriptionData.doctorId);
        }
        if (prescriptionData.appointmentId !== undefined) {
            fields.push('appointmentId = ?');
            values.push(prescriptionData.appointmentId);
        }
        if (prescriptionData.notes !== undefined) {
            fields.push('notes = ?');
            values.push(prescriptionData.notes);
        }
        if (prescriptionData.status !== undefined) {
            fields.push('status = ?');
            values.push(prescriptionData.status);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE prescriptions SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Process prescription (pharmacy)
     */
    static async process(id, processedBy) {
        const db = getDB();
        const prescription = await this.findById(id);

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status !== 'pending') {
            throw new Error('Prescription already processed');
        }

        // Check stock and deduct
        const Medicine = require('./Medicine');
        for (const item of prescription.items) {
            if (item.medicineId) {
                const medicine = await Medicine.findById(item.medicineId);
                if (!medicine) {
                    throw new Error(`Medicine ${item.medicineName} not found`);
                }
                if (medicine.stok < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.medicineName}. Available: ${medicine.stok}, Required: ${item.quantity}`);
                }
                // Deduct stock
                await Medicine.updateStock(item.medicineId, item.quantity, 'subtract');
            }
        }

        // Update prescription status
        await db.run(
            `UPDATE prescriptions 
             SET status = 'processed', processedAt = CURRENT_TIMESTAMP, processedBy = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [processedBy, id]
        );

        // Update appointment status if exists
        if (prescription.appointmentId) {
            await db.run('UPDATE appointments SET status = ? WHERE id = ?', ['completed', prescription.appointmentId]);
        }

        return await this.findById(id);
    }
}

module.exports = Prescription;
