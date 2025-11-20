// Medicine Model (SQLite with sqlite3)
const { getDB } = require('../config/database');

class Medicine {
    /**
     * Generate medicine ID
     */
    static async generateMedicineId() {
        const db = getDB();
        const result = await db.get('SELECT COUNT(*) as count FROM medicines');
        return 'M' + String(result.count + 1).padStart(3, '0');
    }

    /**
     * Find all medicines
     */
    static async findAll(activeOnly = true) {
        const db = getDB();
        if (activeOnly) {
            return await db.all('SELECT * FROM medicines WHERE isActive = 1 ORDER BY nama ASC');
        }
        return await db.all('SELECT * FROM medicines ORDER BY nama ASC');
    }

    /**
     * Find medicine by ID
     */
    static async findById(id) {
        const db = getDB();
        const medicine = await db.get('SELECT * FROM medicines WHERE id = ?', [id]);
        if (medicine) {
            medicine.isActive = Boolean(medicine.isActive);
            medicine.stockStatus = this.getStockStatus(medicine.stok);
        }
        return medicine;
    }

    /**
     * Find medicine by medicineId
     */
    static async findByMedicineId(medicineId) {
        const db = getDB();
        const medicine = await db.get('SELECT * FROM medicines WHERE medicineId = ?', [medicineId]);
        if (medicine) {
            medicine.isActive = Boolean(medicine.isActive);
            medicine.stockStatus = this.getStockStatus(medicine.stok);
        }
        return medicine;
    }

    /**
     * Get stock status
     */
    static getStockStatus(stok) {
        if (stok > 20) return 'aman';
        if (stok > 10) return 'menipis';
        return 'habis';
    }

    /**
     * Create new medicine
     */
    static async create(medicineData) {
        const db = getDB();
        const {
            medicineId,
            nama,
            stok = 0,
            harga,
            satuan = 'tablet',
            kategori,
            expired_date,
            isActive = true
        } = medicineData;

        const finalMedicineId = medicineId || await this.generateMedicineId();

        const result = await db.run(
            `INSERT INTO medicines (medicineId, nama, stok, harga, satuan, kategori, expired_date, isActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalMedicineId, nama, stok, harga, satuan, kategori || null, expired_date || null, isActive ? 1 : 0]
        );

        // Return result object with lastID
        return result;
    }

    /**
     * Update medicine
     */
    static async update(id, medicineData) {
        const db = getDB();
        const fields = [];
        const values = [];

        if (medicineData.nama !== undefined) {
            fields.push('nama = ?');
            values.push(medicineData.nama);
        }
        if (medicineData.stok !== undefined) {
            fields.push('stok = ?');
            values.push(medicineData.stok);
        }
        if (medicineData.harga !== undefined) {
            fields.push('harga = ?');
            values.push(medicineData.harga);
        }
        if (medicineData.satuan !== undefined) {
            fields.push('satuan = ?');
            values.push(medicineData.satuan);
        }
        if (medicineData.kategori !== undefined) {
            fields.push('kategori = ?');
            values.push(medicineData.kategori);
        }
        if (medicineData.expired_date !== undefined) {
            fields.push('expired_date = ?');
            values.push(medicineData.expired_date);
        }
        if (medicineData.isActive !== undefined) {
            fields.push('isActive = ?');
            values.push(medicineData.isActive ? 1 : 0);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE medicines SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Update stock
     */
    static async updateStock(id, quantity, operation = 'set') {
        const medicine = await this.findById(id);
        
        if (!medicine) {
            throw new Error('Medicine not found');
        }

        let newStock;
        if (operation === 'add') {
            newStock = medicine.stok + quantity;
        } else if (operation === 'subtract') {
            newStock = medicine.stok - quantity;
            if (newStock < 0) {
                throw new Error('Insufficient stock');
            }
        } else {
            newStock = quantity;
        }

        return await this.update(id, { stok: newStock });
    }

    /**
     * Delete medicine (soft delete)
     */
    static async delete(id) {
        const db = getDB();
        const result = await db.run('UPDATE medicines SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        return result.changes > 0;
    }
}

module.exports = Medicine;
