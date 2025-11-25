const { readData, writeData, generateId } = require('../utils/jsonHelper');

const MEDICAL_RECORDS_FILE = 'medical_records.json';
const VISITS_FILE = 'visits.json';

const createMedicalRecord = (req, res) => {
    const { visitId, patientId, doctorId, vitals, diagnosis, prescription, notes } = req.body;
    const records = readData(MEDICAL_RECORDS_FILE);
    const visits = readData(VISITS_FILE);

    // Verify visit exists
    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex === -1) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const newRecord = {
        id: generateId(),
        visitId,
        patientId,
        doctorId,
        date: new Date().toISOString(),
        vitals, // { height, weight, bloodPressure, temperature }
        diagnosis,
        notes,
        prescription // Array of { medicineId, quantity, instructions }
    };

    records.push(newRecord);

    // Update visit status to 'Pharmacy' if there is a prescription, otherwise 'Cashier' or 'Done'
    // For now, let's say if there's a prescription, go to Pharmacy.
    // If no prescription but there is a consultation fee, go to Cashier.
    // Let's assume flow: Examining -> Pharmacy (if meds) -> Cashier

    let nextStatus = 'Cashier';
    if (prescription && prescription.length > 0) {
        nextStatus = 'Pharmacy';
    }

    visits[visitIndex].status = nextStatus;
    writeData(VISITS_FILE, visits);

    if (writeData(MEDICAL_RECORDS_FILE, records)) {
        res.json({ success: true, message: 'Medical record saved', record: newRecord });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save medical record' });
    }
};

const getMedicalRecordsByPatient = (req, res) => {
    const { patientId } = req.params;
    const records = readData(MEDICAL_RECORDS_FILE);
    const patientRecords = records.filter(r => r.patientId === patientId);
    res.json(patientRecords);
};

module.exports = {
    createMedicalRecord,
    getMedicalRecordsByPatient
};
