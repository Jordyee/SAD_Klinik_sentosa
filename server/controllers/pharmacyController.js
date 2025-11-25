const { readData, writeData, generateId } = require('../utils/jsonHelper');

const MEDICINES_FILE = 'medicines.json';
const MEDICAL_RECORDS_FILE = 'medical_records.json';
const VISITS_FILE = 'visits.json';
const PATIENTS_FILE = 'patients.json';

// --- Medicine Management ---

const getMedicines = (req, res) => {
    const medicines = readData(MEDICINES_FILE);
    res.json(medicines);
};

const addMedicine = (req, res) => {
    const { name, category, stock, price, unit } = req.body;
    const medicines = readData(MEDICINES_FILE);

    const newMedicine = {
        id: generateId(),
        name,
        category,
        stock: parseInt(stock),
        price: parseInt(price),
        unit
    };

    medicines.push(newMedicine);
    writeData(MEDICINES_FILE, medicines);
    res.json({ success: true, message: 'Medicine added', medicine: newMedicine });
};

const updateMedicine = (req, res) => {
    const { id } = req.params;
    const { name, category, stock, price, unit } = req.body;
    const medicines = readData(MEDICINES_FILE);

    const index = medicines.findIndex(m => m.id === id);
    if (index !== -1) {
        medicines[index] = { ...medicines[index], name, category, stock, price, unit };
        writeData(MEDICINES_FILE, medicines);
        res.json({ success: true, message: 'Medicine updated', medicine: medicines[index] });
    } else {
        res.status(404).json({ success: false, message: 'Medicine not found' });
    }
};

// --- Prescription Processing (Incoming) ---

const getPendingPrescriptions = (req, res) => {
    const visits = readData(VISITS_FILE);
    const records = readData(MEDICAL_RECORDS_FILE);
    const patients = readData(PATIENTS_FILE);

    // Find visits currently in 'Pharmacy' status
    const pharmacyVisits = visits.filter(v => v.status === 'Pharmacy');

    const prescriptions = pharmacyVisits.map(visit => {
        // Find the specific record that contains the prescription
        const record = records.find(r => r.visitId === visit.id && r.prescription && r.prescription.length > 0);
        const patient = patients.find(p => p.id === visit.patientId);

        if (!record) return null;

        return {
            visitId: visit.id,
            patientName: patient ? patient.name : 'Unknown',
            date: record.date,
            items: record.prescription || []
        };
    }).filter(p => p !== null);

    res.json(prescriptions);
};

const processPrescription = (req, res) => {
    const { visitId } = req.body;
    const visits = readData(VISITS_FILE);
    const records = readData(MEDICAL_RECORDS_FILE);
    const medicines = readData(MEDICINES_FILE);

    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex === -1) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Find the record with prescription
    const record = records.find(r => r.visitId === visitId && r.prescription && r.prescription.length > 0);
    if (!record) {
        return res.status(400).json({ success: false, message: 'No prescription found for this visit' });
    }

    // Check and reduce stock
    let stockError = null;
    const updatedMedicines = [...medicines];

    record.prescription.forEach(item => {
        const medIndex = updatedMedicines.findIndex(m => m.id === item.medicineId);
        if (medIndex !== -1) {
            if (updatedMedicines[medIndex].stock >= item.quantity) {
                updatedMedicines[medIndex].stock -= item.quantity;
            } else {
                stockError = `Insufficient stock for ${updatedMedicines[medIndex].name}`;
            }
        }
    });

    if (stockError) {
        return res.status(400).json({ success: false, message: stockError });
    }

    // Commit changes
    writeData(MEDICINES_FILE, updatedMedicines);

    // Move to Cashier
    visits[visitIndex].status = 'Cashier';
    writeData(VISITS_FILE, visits);

    res.json({ success: true, message: 'Prescription processed, moved to Cashier' });
};

// --- Handover & History ---

const getReadyPrescriptions = (req, res) => {
    const visits = readData(VISITS_FILE);
    const records = readData(MEDICAL_RECORDS_FILE);
    const patients = readData(PATIENTS_FILE);

    const readyVisits = visits.filter(v => v.status === 'Pharmacy_Ready');

    const prescriptions = readyVisits.map(visit => {
        // Find the specific record that contains the prescription
        const record = records.find(r => r.visitId === visit.id && r.prescription && r.prescription.length > 0);
        const patient = patients.find(p => p.id === visit.patientId);

        if (!record) return null;

        return {
            visitId: visit.id,
            patientName: patient ? patient.name : 'Unknown',
            date: record.date,
            items: record.prescription || []
        };
    }).filter(p => p !== null);

    res.json(prescriptions);
};

const completeHandover = (req, res) => {
    const { visitId } = req.body;
    const visits = readData(VISITS_FILE);

    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex === -1) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    visits[visitIndex].status = 'Done';
    writeData(VISITS_FILE, visits);

    res.json({ success: true, message: 'Medicine handover complete, visit done' });
};

const getPharmacyHistory = (req, res) => {
    const visits = readData(VISITS_FILE);
    const records = readData(MEDICAL_RECORDS_FILE);
    const patients = readData(PATIENTS_FILE);

    // Find completed visits that had prescriptions
    const doneVisits = visits.filter(v => v.status === 'Done');

    const history = doneVisits.map(visit => {
        // Find the specific record that contains the prescription
        const record = records.find(r => r.visitId === visit.id && r.prescription && r.prescription.length > 0);
        const patient = patients.find(p => p.id === visit.patientId);

        if (!record) return null;

        return {
            visitId: visit.id,
            patientName: patient ? patient.name : 'Unknown',
            date: record.date,
            items: record.prescription
        };
    }).filter(h => h !== null);

    res.json(history);
};

module.exports = {
    getMedicines,
    updateMedicine,
    addMedicine,
    getPendingPrescriptions,
    processPrescription,
    getReadyPrescriptions,
    completeHandover,
    getPharmacyHistory
};
