const { readData, writeData, generateId } = require('../utils/jsonHelper');

const MEDICINES_FILE = 'medicines.json';
const MEDICAL_RECORDS_FILE = 'medical_records.json';
const VISITS_FILE = 'visits.json';

// Medicine Management
const getMedicines = (req, res) => {
    const medicines = readData(MEDICINES_FILE);
    res.json(medicines);
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

// Prescription Processing
const getPendingPrescriptions = (req, res) => {
    const visits = readData(VISITS_FILE);
    const records = readData(MEDICAL_RECORDS_FILE);
    const patients = require('../data/patients.json'); // Direct read for simplicity in joining

    // Find visits currently in 'Pharmacy' status
    const pharmacyVisits = visits.filter(v => v.status === 'Pharmacy');

    const prescriptions = pharmacyVisits.map(visit => {
        const record = records.find(r => r.visitId === visit.id);
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

    // Find the record with prescription (there might be multiple records for same visit - vitals + diagnosis)
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

module.exports = {
    getMedicines,
    updateMedicine,
    addMedicine,
    getPendingPrescriptions,
    processPrescription
};
