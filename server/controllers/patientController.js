const { readData, writeData, generateId } = require('../utils/jsonHelper');

const PATIENTS_FILE = 'patients.json';
const VISITS_FILE = 'visits.json';

// Patient Logic
const getPatients = (req, res) => {
    const patients = readData(PATIENTS_FILE);
    const { search } = req.query;

    if (search) {
        const lowerSearch = search.toLowerCase();
        const filtered = patients.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.nik.includes(search) ||
            p.id.includes(search)
        );
        return res.json(filtered);
    }

    res.json(patients);
};

const getPatientById = (req, res) => {
    const { id } = req.params;
    const patients = readData(PATIENTS_FILE);
    const patient = patients.find(p => p.id === id);

    if (patient) {
        res.json(patient);
    } else {
        res.status(404).json({ message: 'Patient not found' });
    }
};

const createPatient = (req, res) => {
    const { nik, name, address, phone, dob, gender, insuranceType } = req.body;
    const patients = readData(PATIENTS_FILE);

    // Check if NIK already exists
    if (patients.find(p => p.nik === nik)) {
        return res.status(400).json({ success: false, message: 'Patient with this NIK already exists' });
    }

    const newPatient = {
        id: generateId(),
        nik,
        name,
        address,
        phone,
        dob,
        gender,
        insuranceType
    };

    patients.push(newPatient);
    if (writeData(PATIENTS_FILE, patients)) {
        res.json({ success: true, message: 'Patient registered successfully', patient: newPatient });
    } else {
        res.status(500).json({ success: false, message: 'Failed to register patient' });
    }
};

// Visit/Queue Logic
const createVisit = (req, res) => {
    const { patientId } = req.body;
    const visits = readData(VISITS_FILE);
    const patients = readData(PATIENTS_FILE);

    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Check if patient is already in active queue (not 'Done')
    const activeVisit = visits.find(v => v.patientId === patientId && v.status !== 'Done');
    if (activeVisit) {
        return res.status(400).json({ success: false, message: 'Patient is already in queue' });
    }

    // Generate queue number (simple increment for today)
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.date.startsWith(today));
    const queueNumber = todayVisits.length + 1;

    const newVisit = {
        id: generateId(),
        patientId,
        patientName: patient.name, // Denormalize for easier display
        date: new Date().toISOString(),
        status: 'Waiting', // Waiting, Examining, Pharmacy, Cashier, Done
        queueNumber
    };

    visits.push(newVisit);
    if (writeData(VISITS_FILE, visits)) {
        res.json({ success: true, message: 'Patient added to queue', visit: newVisit });
    } else {
        res.status(500).json({ success: false, message: 'Failed to add to queue' });
    }
};

const getActiveVisits = (req, res) => {
    const visits = readData(VISITS_FILE);
    // Filter out 'Done' visits, or maybe just return all for today?
    // Let's return all active ones for now.
    const activeVisits = visits.filter(v => v.status !== 'Done');
    res.json(activeVisits);
};

const updateVisitStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const visits = readData(VISITS_FILE);

    const visitIndex = visits.findIndex(v => v.id === id);
    if (visitIndex !== -1) {
        visits[visitIndex].status = status;
        writeData(VISITS_FILE, visits);
        res.json({ success: true, message: 'Visit status updated', visit: visits[visitIndex] });
    } else {
        res.status(404).json({ success: false, message: 'Visit not found' });
    }
};

module.exports = {
    getPatients,
    getPatientById,
    createPatient,
    createVisit,
    getActiveVisits,
    updateVisitStatus
};
