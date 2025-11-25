// Medicine Model (Firebase Firestore)
const { getDB, docToObject, snapshotToArray, admin } = require('../config/database');

class Medicine {
    /**
     * Get Firestore collection reference
     */
    static getCollection() {
        const db = getDB();
        return db.collection('medicines');
    }

    /**
     * Generate medicine ID
     */
    static async generateMedicineId() {
        const snapshot = await this.getCollection().count().get();
        const count = snapshot.data().count;
        return 'M' + String(count + 1).padStart(3, '0');
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
     * Find all medicines
     */
    static async findAll(activeOnly = true) {
        try {
            let query = this.getCollection();

            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }

            const snapshot = await query.orderBy('nama', 'asc').get();
            const medicines = snapshotToArray(snapshot);

            // Add stock status to each medicine
            return medicines.map(med => ({
                ...med,
                stockStatus: this.getStockStatus(med.stok)
            }));
        } catch (error) {
            console.error('Error finding all medicines:', error);
            throw error;
        }
    }

    /**
     * Find medicine by Firestore document ID
     */
    static async findById(id) {
        try {
            const doc = await this.getCollection().doc(id).get();
            const medicine = docToObject(doc);

            if (medicine) {
                medicine.stockStatus = this.getStockStatus(medicine.stok);
            }

            return medicine;
        } catch (error) {
            console.error('Error finding medicine by ID:', error);
            throw error;
        }
    }

    /**
     * Find medicine by medicineId (custom field)
     */
    static async findByMedicineId(medicineId) {
        try {
            const snapshot = await this.getCollection()
                .where('medicineId', '==', medicineId)
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            const medicine = docToObject(snapshot.docs[0]);
            if (medicine) {
                medicine.stockStatus = this.getStockStatus(medicine.stok);
            }

            return medicine;
        } catch (error) {
            console.error('Error finding medicine by medicineId:', error);
            throw error;
        }
    }

    /**
     * Create new medicine
     */
    static async create(medicineData) {
        try {
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

            const newMedicine = {
                medicineId: finalMedicineId,
                nama,
                stok: parseInt(stok),
                harga: parseInt(harga),
                satuan,
                kategori: kategori || null,
                expired_date: expired_date || null,
                isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await this.getCollection().add(newMedicine);

            return {
                id: docRef.id,
                ...newMedicine,
                stockStatus: this.getStockStatus(newMedicine.stok)
            };
        } catch (error) {
            console.error('Error creating medicine:', error);
            throw error;
        }
    }

    /**
     * Update medicine
     */
    static async update(id, medicineData) {
        try {
            const updateData = { ...medicineData };
            updateData.updatedAt = new Date();

            // Convert numeric fields
            if (updateData.stok !== undefined) {
                updateData.stok = parseInt(updateData.stok);
            }
            if (updateData.harga !== undefined) {
                updateData.harga = parseInt(updateData.harga);
            }

            await this.getCollection().doc(id).update(updateData);
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating medicine:', error);
            throw error;
        }
    }

    /**
     * Update stock with transaction (for atomic operations)
     */
    static async updateStock(id, quantity, operation = 'set') {
        const db = getDB();
        const docRef = this.getCollection().doc(id);

        try {
            return await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);

                if (!doc.exists) {
                    throw new Error('Medicine not found');
                }

                const medicine = doc.data();
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

                transaction.update(docRef, {
                    stok: newStock,
                    updatedAt: new Date()
                });

                return {
                    id: doc.id,
                    ...medicine,
                    stok: newStock,
                    stockStatus: this.getStockStatus(newStock)
                };
            });
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    }

    /**
     * Delete medicine (soft delete)
     */
    static async delete(id) {
        try {
            await this.getCollection().doc(id).update({
                isActive: false,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error deleting medicine:', error);
            return false;
        }
    }

    /**
     * Search medicines by name
     */
    static async search(query, limit = 20) {
        try {
            // Fetch all and filter client-side for now
            const snapshot = await this.getCollection()
                .where('isActive', '==', true)
                .limit(100)
                .get();

            const allMedicines = snapshotToArray(snapshot);
            const searchTerm = query.toLowerCase();

            const results = allMedicines.filter(med =>
                med.nama?.toLowerCase().includes(searchTerm) ||
                med.medicineId?.toLowerCase().includes(searchTerm)
            );

            return results.slice(0, limit).map(med => ({
                ...med,
                stockStatus: this.getStockStatus(med.stok)
            }));
        } catch (error) {
            console.error('Error searching medicines:', error);
            throw error;
        }
    }

    /**
     * Get low stock medicines
     */
    static async getLowStock(threshold = 20) {
        try {
            const snapshot = await this.getCollection()
                .where('isActive', '==', true)
                .where('stok', '<=', threshold)
                .get();

            return snapshotToArray(snapshot).map(med => ({
                ...med,
                stockStatus: this.getStockStatus(med.stok)
            }));
        } catch (error) {
            console.error('Error getting low stock medicines:', error);
            throw error;
        }
    }
}

module.exports = Medicine;
