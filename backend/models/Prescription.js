// Prescription Model (Firebase Firestore)
const { getDB, docToObject, snapshotToArray, admin } = require('../config/database');

class Prescription {
    /**
     * Get Firestore collection reference
     */
    static getCollection() {
        const db = getDB();
        return db.collection('prescriptions');
    }

    /**
     * Generate prescription ID
     */
    static async generatePrescriptionId() {
        const snapshot = await this.getCollection().count().get();
        const count = snapshot.data().count;
        return 'RX' + String(count + 1).padStart(4, '0');
    }

    /**
     * Find all prescriptions
     */
    static async findAll(orderBy = 'createdAt', direction = 'desc') {
        try {
            const snapshot = await this.getCollection()
                .orderBy(orderBy, direction)
                .get();

            const prescriptions = [];
            for (const doc of snapshot.docs) {
                const prescription = docToObject(doc);
                // Get items subcollection
                prescription.items = await this.getItems(doc.id);
                prescriptions.push(prescription);
            }

            return prescriptions;
        } catch (error) {
            console.error('Error finding all prescriptions:', error);
            throw error;
        }
    }

    /**
     * Find prescription by ID
     */
    static async findById(id) {
        try {
            const doc = await this.getCollection().doc(id).get();
            const prescription = docToObject(doc);

            if (prescription) {
                prescription.items = await this.getItems(id);
            }

            return prescription;
        } catch (error) {
            console.error('Error finding prescription by ID:', error);
            throw error;
        }
    }

    /**
     * Find prescription by prescriptionId (custom field)
     */
    static async findByPrescriptionId(prescriptionId) {
        try {
            const snapshot = await this.getCollection()
                .where('prescriptionId', '==', prescriptionId)
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            const prescription = docToObject(snapshot.docs[0]);
            if (prescription) {
                prescription.items = await this.getItems(snapshot.docs[0].id);
            }

            return prescription;
        } catch (error) {
            console.error('Error finding prescription by prescriptionId:', error);
            throw error;
        }
    }

    /**
     * Find prescriptions by patient ID
     */
    static async findByPatientId(patientId) {
        try {
            const snapshot = await this.getCollection()
                .where('patientId', '==', patientId)
                .orderBy('createdAt', 'desc')
                .get();

            const prescriptions = [];
            for (const doc of snapshot.docs) {
                const prescription = docToObject(doc);
                prescription.items = await this.getItems(doc.id);
                prescriptions.push(prescription);
            }

            return prescriptions;
        } catch (error) {
            console.error('Error finding prescriptions by patient ID:', error);
            throw error;
        }
    }

    /**
     * Find prescriptions by status
     */
    static async findByStatus(status) {
        try {
            const snapshot = await this.getCollection()
                .where('status', '==', status)
                .orderBy('createdAt', 'desc')
                .get();

            const prescriptions = [];
            for (const doc of snapshot.docs) {
                const prescription = docToObject(doc);
                prescription.items = await this.getItems(doc.id);
                prescriptions.push(prescription);
            }

            return prescriptions;
        } catch (error) {
            console.error('Error finding prescriptions by status:', error);
            throw error;
        }
    }

    /**
     * Get prescription items (subcollection)
     */
    static async getItems(prescriptionId) {
        try {
            const snapshot = await this.getCollection()
                .doc(prescriptionId)
                .collection('items')
                .get();

            return snapshotToArray(snapshot);
        } catch (error) {
            console.error('Error getting prescription items:', error);
            return [];
        }
    }

    /**
     * Create new prescription with items
     */
    static async create(prescriptionData) {
        const db = getDB();

        try {
            const prescriptionId = await this.generatePrescriptionId();

            const newPrescription = {
                prescriptionId,
                patientId: prescriptionData.patientId,
                patientName: prescriptionData.patientName || null,
                doctorId: prescriptionData.doctorId || null,
                doctorName: prescriptionData.doctorName || null,
                appointmentId: prescriptionData.appointmentId || null,
                notes: prescriptionData.notes || '',
                status: prescriptionData.status || 'pending',
                processedAt: null,
                processedBy: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await this.getCollection().add(newPrescription);

            // Add prescription items to subcollection
            if (prescriptionData.items && prescriptionData.items.length > 0) {
                const batch = db.batch();

                prescriptionData.items.forEach(item => {
                    const itemRef = docRef.collection('items').doc();
                    batch.set(itemRef, {
                        medicineId: item.medicineId || null,
                        medicineName: item.medicineName,
                        quantity: parseInt(item.quantity),
                        dosage: item.dosage || '',
                        instructions: item.instructions || '',
                        createdAt: new Date()
                    });
                });

                await batch.commit();
            }

            return {
                id: docRef.id,
                ...newPrescription,
                items: prescriptionData.items || []
            };
        } catch (error) {
            console.error('Error creating prescription:', error);
            throw error;
        }
    }

    /**
     * Update prescription
     */
    static async update(id, prescriptionData) {
        try {
            const updateData = { ...prescriptionData };
            delete updateData.items; // Don't update items here
            updateData.updatedAt = new Date();

            await this.getCollection().doc(id).update(updateData);
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating prescription:', error);
            throw error;
        }
    }

    /**
     * Update prescription status
     */
    static async updateStatus(id, status, processedBy = null) {
        try {
            const updateData = {
                status,
                updatedAt: new Date()
            };

            if (status === 'processed' && processedBy) {
                updateData.processedAt = new Date();
                updateData.processedBy = processedBy;
            }

            await this.getCollection().doc(id).update(updateData);
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating prescription status:', error);
            throw error;
        }
    }

    /**
     * Delete prescription (and its items)
     */
    static async delete(id) {
        const db = getDB();

        try {
            // Delete items first
            const itemsSnapshot = await this.getCollection()
                .doc(id)
                .collection('items')
                .get();

            const batch = db.batch();
            itemsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Delete prescription
            batch.delete(this.getCollection().doc(id));

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error deleting prescription:', error);
            return false;
        }
    }

    /**
     * Add item to prescription
     */
    static async addItem(prescriptionId, itemData) {
        try {
            const itemRef = await this.getCollection()
                .doc(prescriptionId)
                .collection('items')
                .add({
                    medicineId: itemData.medicineId || null,
                    medicineName: itemData.medicineName,
                    quantity: parseInt(itemData.quantity),
                    dosage: itemData.dosage || '',
                    instructions: itemData.instructions || '',
                    createdAt: new Date()
                });

            return {
                id: itemRef.id,
                ...itemData
            };
        } catch (error) {
            console.error('Error adding prescription item:', error);
            throw error;
        }
    }

    /**
     * Remove item from prescription
     */
    static async removeItem(prescriptionId, itemId) {
        try {
            await this.getCollection()
                .doc(prescriptionId)
                .collection('items')
                .doc(itemId)
                .delete();

            return true;
        } catch (error) {
            console.error('Error removing prescription item:', error);
            return false;
        }
    }
}

module.exports = Prescription;
