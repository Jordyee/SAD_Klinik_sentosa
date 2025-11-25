const { readData, writeData, generateId } = require('../utils/jsonHelper');

const TRANSACTIONS_FILE = 'transactions.json';
const VISITS_FILE = 'visits.json';
const MEDICAL_RECORDS_FILE = 'medical_records.json';
const MEDICINES_FILE = 'medicines.json';
const PATIENTS_FILE = 'patients.json';

// Billing Logic
const getPendingBillings = (req, res) => {
    const visits = readData(VISITS_FILE);
    const records = readData(MEDICAL_RECORDS_FILE);
    const patients = readData(PATIENTS_FILE);
    const medicines = readData(MEDICINES_FILE);

    // Find visits in 'Cashier' status
    const cashierVisits = visits.filter(v => v.status === 'Cashier');

    const billings = cashierVisits.map(visit => {
        const record = records.find(r => r.visitId === visit.id);
        const patient = patients.find(p => p.id === visit.patientId);

        if (!record) return null;

        // Calculate costs
        let medicineCost = 0;
        const medicineDetails = [];

        if (record.prescription) {
            record.prescription.forEach(item => {
                const med = medicines.find(m => m.id === item.medicineId);
                if (med) {
                    const cost = med.price * item.quantity;
                    medicineCost += cost;
                    medicineDetails.push({
                        name: med.name,
                        quantity: item.quantity,
                        price: med.price,
                        total: cost
                    });
                }
            });
        }

        const consultationFee = 50000; // Standard fee
        const totalAmount = medicineCost + consultationFee;

        return {
            visitId: visit.id,
            patientName: patient ? patient.name : 'Unknown',
            patientId: patient ? patient.id : null,
            date: record.date,
            consultationFee,
            medicineCost,
            totalAmount,
            details: medicineDetails
        };
    }).filter(b => b !== null);

    res.json(billings);
};

const createTransaction = (req, res) => {
    const { visitId, totalAmount, items, paymentMethod } = req.body;
    const transactions = readData(TRANSACTIONS_FILE);
    const visits = readData(VISITS_FILE);

    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex === -1) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const newTransaction = {
        id: generateId(),
        visitId,
        totalAmount,
        items, // Array of { description, amount }
        paymentMethod,
        status: 'Paid',
        timestamp: new Date().toISOString()
    };

    transactions.push(newTransaction);

    // Update visit status to 'Pharmacy_Ready' (Back to Pharmacy for handover)
    visits[visitIndex].status = 'Pharmacy_Ready';
    writeData(VISITS_FILE, visits);

    if (writeData(TRANSACTIONS_FILE, transactions)) {
        res.json({ success: true, message: 'Payment successful', transaction: newTransaction });
    } else {
        res.status(500).json({ success: false, message: 'Failed to process payment' });
    }
};

// Reporting Logic
const getReports = (req, res) => {
    const { type, date } = req.query; // type: 'daily' or 'monthly', date: 'YYYY-MM-DD' or 'YYYY-MM'
    const transactions = readData(TRANSACTIONS_FILE);

    let filteredTransactions = transactions;

    if (type === 'daily' && date) {
        filteredTransactions = transactions.filter(t => t.timestamp.startsWith(date));
    } else if (type === 'monthly' && date) {
        filteredTransactions = transactions.filter(t => t.timestamp.startsWith(date));
    }

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPatients = filteredTransactions.length;

    res.json({
        period: date,
        type,
        totalRevenue,
        totalPatients,
        transactions: filteredTransactions
    });
};

module.exports = {
    getPendingBillings,
    createTransaction,
    getReports
};
