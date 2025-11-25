// ===================================================================
// CENTRALIZED DATA INTEGRATION & MANAGEMENT - FIREBASE VERSION
// ===================================================================
// All data now stored in Firebase Firestore instead of localStorage

// ===================================================================
// FIREBASE INITIALIZATION CHECK
// ===================================================================
if (typeof firebaseDB === 'undefined') {
    console.error('Firebase not initialized! Make sure firebase-config.js is loaded first.');
}

// ===================================================================
// QUEUE/APPOINTMENTS MANAGEMENT
// ===================================================================

/**
 * Get all appointments (queue)
 */
async function getQueue() {
    try {
        const snapshot = await firebaseDB.collection('appointments')
            .orderBy('queueNumber', 'asc')
            .get();

        const queue = [];
        snapshot.forEach(doc => {
            queue.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return queue;
    } catch (error) {
        console.error('Error getting queue:', error);
        return [];
    }
}

/**
 * Save appointment to queue
 */
async function saveToQueue(appointmentData) {
    try {
        const docRef = await firebaseDB.collection('appointments').add({
            ...appointmentData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Appointment saved to queue with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error saving to queue:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update appointment status
 */
async function updateQueueStatus(appointmentId, newStatus) {
    try {
        await firebaseDB.collection('appointments').doc(appointmentId).update({
            status: newStatus,
            updatedAt: new Date()
        });

        console.log(`Status for appointment ${appointmentId} updated to ${newStatus}`);
        return true;
    } catch (error) {
        console.error('Error updating queue status:', error);
        return false;
    }
}

// ===================================================================
// PATIENT DATA MANAGEMENT
// ===================================================================

/**
 * Get all patients
 */
async function getAllPatientData() {
    try {
        const snapshot = await firebaseDB.collection('patients').get();

        const patients = [];
        snapshot.forEach(doc => {
            patients.push({
                id: doc.id,
                patientId: doc.id, // Use Firestore doc ID as patientId
                ...doc.data()
            });
        });

        return patients;
    } catch (error) {
        console.error('Error getting patient data:', error);
        return [];
    }
}

/**
 * Save single patient
 */
async function savePatientData(patientData) {
    try {
        const docRef = await firebaseDB.collection('patients').add({
            ...patientData,
            registrationDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Patient saved with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error saving patient:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Find patient by ID
 */
async function findPatientById(patientId) {
    try {
        const doc = await firebaseDB.collection('patients').doc(patientId).get();

        if (doc.exists) {
            return {
                id: doc.id,
                patientId: doc.id,
                ...doc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error finding patient:', error);
        return null;
    }
}

/**
 * Find patient by username (linked account)
 */
async function findPatientByUsername(username) {
    try {
        const snapshot = await firebaseDB.collection('patients')
            .where('linkedUsername', '==', username)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                patientId: doc.id,
                ...doc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error finding patient by username:', error);
        return null;
    }
}

/**
 * Get patient name by ID
 */
async function getPatientName(patientId) {
    const patient = await findPatientById(patientId);
    return patient ? (patient.nama || patient.name || 'Unknown Patient') : 'Unknown Patient';
}

// ===================================================================
// MEDICINE MANAGEMENT
// ===================================================================

/**
 * Get all medicines
 */
async function getMedicines() {
    try {
        const snapshot = await firebaseDB.collection('medicines').get();

        const medicines = [];
        snapshot.forEach(doc => {
            medicines.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return medicines;
    } catch (error) {
        console.error('Error getting medicines:', error);
        return [];
    }
}

/**
 * Save/Add medicine
 */
async function saveMedicine(medicineData) {
    try {
        const docRef = await firebaseDB.collection('medicines').add({
            ...medicineData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Medicine saved with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error saving medicine:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update medicine stock
 */
async function updateMedicineStock(medicineId, newStock) {
    try {
        await firebaseDB.collection('medicines').doc(medicineId).update({
            stok: newStock,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating medicine stock:', error);
        return { success: false, error: error.message };
    }
}

// ===================================================================
// PRESCRIPTION MANAGEMENT
// ===================================================================

/**
 * Get all prescriptions
 */
async function getPrescriptions() {
    try {
        const snapshot = await firebaseDB.collection('prescriptions')
            .orderBy('date', 'desc')
            .get();

        const prescriptions = [];

        // Get prescriptions with their items
        for (const doc of snapshot.docs) {
            const prescriptionData = {
                id: doc.id,
                ...doc.data()
            };

            // Get items subcollection
            const itemsSnapshot = await doc.ref.collection('items').get();
            const items = [];
            itemsSnapshot.forEach(itemDoc => {
                items.push({
                    id: itemDoc.id,
                    ...itemDoc.data()
                });
            });

            prescriptionData.items = items;
            prescriptions.push(prescriptionData);
        }

        return prescriptions;
    } catch (error) {
        console.error('Error getting prescriptions:', error);
        return [];
    }
}

/**
 * Save prescription with items
 */
async function savePrescription(prescriptionData) {
    try {
        const { items, ...prescriptionMain } = prescriptionData;

        // Save main prescription
        const prescriptionRef = await firebaseDB.collection('prescriptions').add({
            ...prescriptionMain,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save items as subcollection
        if (items && items.length > 0) {
            const batch = firebaseDB.batch();

            items.forEach(item => {
                const itemRef = prescriptionRef.collection('items').doc();
                batch.set(itemRef, item);
            });

            await batch.commit();
        }

        console.log('Prescription saved with ID:', prescriptionRef.id);
        return { success: true, id: prescriptionRef.id };
    } catch (error) {
        console.error('Error saving prescription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update prescription status
 */
async function updatePrescriptionStatus(prescriptionId, newStatus) {
    try {
        await firebaseDB.collection('prescriptions').doc(prescriptionId).update({
            status: newStatus,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating prescription status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync prescription to pharmacy (legacy function - now just saves prescription)
 */
async function syncPrescriptionToPharmacy(patientId, prescriptionData) {
    try {
        const patientName = await getPatientName(patientId);

        const prescription = {
            patientId: patientId,
            patientName: patientName,
            notes: prescriptionData.notes || '',
            status: 'pending',
            paymentStatus: 'unpaid',
            items: prescriptionData.items || []
        };

        const result = await savePrescription(prescription);

        if (result.success) {
            // Update appointment status
            if (prescriptionData.appointmentId) {
                await updateQueueStatus(prescriptionData.appointmentId, 'Menunggu Resep');
            }
        }

        return result;
    } catch (error) {
        console.error('Error syncing prescription:', error);
        return { success: false, error: error.message };
    }
}

// ===================================================================
// PHARMACY HISTORY MANAGEMENT
// ===================================================================

/**
 * Save completed prescription to pharmacy history
 */
async function savePharmacyHistory(historyData) {
    try {
        const docRef = await firebaseDB.collection('pharmacyHistory').add({
            ...historyData,
            completedAt: new Date(),
            createdAt: new Date()
        });

        console.log('Pharmacy history saved with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error saving pharmacy history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all pharmacy history records
 */
async function getPharmacyHistory() {
    try {
        const snapshot = await firebaseDB.collection('pharmacyHistory')
            .orderBy('completedAt', 'desc')
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return history;
    } catch (error) {
        console.error('Error getting pharmacy history:', error);
        return [];
    }
}

/**
 * Update single medicine (for stock management)
 */
async function updateMedicine(medicineId, medicineData) {
    try {
        await firebaseDB.collection('medicines').doc(medicineId).update({
            ...medicineData,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating medicine:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save/update multiple medicines (batch operation for backward compatibility)
 */
async function saveMedicines(medicines) {
    try {
        const batch = firebaseDB.batch();

        medicines.forEach(medicine => {
            const docRef = firebaseDB.collection('medicines').doc(medicine.id);
            batch.set(docRef, {
                ...medicine,
                updatedAt: new Date()
            }, { merge: true });
        });

        await batch.commit();
        console.log('Medicines batch saved successfully');
        return { success: true };
    } catch (error) {
        console.error('Error saving medicines batch:', error);
        return { success: false, error: error.message };
    }
}

// ===================================================================
// INITIALIZATION & SAMPLE DATA
// ===================================================================

/**
 * Initialize sample data in Firebase (run once)
 */
async function initializeSampleData() {
    try {
        // Check if medicines exist
        const medicinesSnapshot = await firebaseDB.collection('medicines').limit(1).get();

        if (medicinesSnapshot.empty) {
            console.log('Initializing sample medicines...');

            const sampleMedicines = [
                { nama: 'Paracetamol 500mg', stok: 150, harga: 5000, golongan: 'Bebas', unit: 'tablet' },
                { nama: 'Amoxicillin 500mg', stok: 80, harga: 15000, golongan: 'Keras', unit: 'kapsul' },
                { nama: 'Ibuprofen 400mg', stok: 120, harga: 8000, golongan: 'Bebas Terbatas', unit: 'tablet' },
                { nama: 'Cetirizine 10mg', stok: 90, harga: 12000, golongan: 'Bebas Terbatas', unit: 'tablet' },
                { nama: 'Omeprazole 20mg', stok: 60, harga: 20000, golongan: 'Keras', unit: 'kapsul' }
            ];

            for (const medicine of sampleMedicines) {
                await saveMedicine(medicine);
            }

            console.log('Sample medicines initialized!');
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Initialize on page load (only if Firebase is available)
if (typeof window !== 'undefined' && typeof firebaseDB !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize sample data if needed
        initializeSampleData();
    });
}

console.log('✅ Data Integration (Firebase) loaded successfully!');
