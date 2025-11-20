// --- Centralized Data Integration & Management ---

const PATIENT_DATA_KEY = 'klinikPatientData';
const QUEUE_KEY = 'patientQueue';
const MEDICINES_KEY = 'medicines';
const PRESCRIPTIONS_KEY = 'pendingPrescriptions';

// --- Queue Management ---
function getQueue() {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
}

function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function updateQueueStatus(patientId, newStatus) {
    let queue = getQueue();
    const patientIndex = queue.findIndex(item => item.patient.patientId === patientId);
    
    if (patientIndex !== -1) {
        queue[patientIndex].status = newStatus;
        saveQueue(queue);
        console.log(`Status for patient ${patientId} updated to ${newStatus}`);
        return true;
    }
    console.error(`Patient with ID ${patientId} not found in queue.`);
    return false;
}

// --- Patient Data Management ---
function getAllPatientData() {
    return JSON.parse(localStorage.getItem(PATIENT_DATA_KEY)) || [];
}

function saveAllPatientData(data) {
    localStorage.setItem(PATIENT_DATA_KEY, JSON.stringify(data));
}

function findPatientById(patientId) {
    const patients = getAllPatientData();
    return patients.find(p => p.patientId === patientId);
}

function findPatientByUsername(username) {
    const patients = getAllPatientData();
    return patients.find(p => p.linkedUsername === username);
}

function getPatientName(patientId) {
    const patient = findPatientById(patientId);
    return patient ? patient.nama : 'Unknown Patient';
}

// --- Medicine Management ---
function getMedicines() {
    return JSON.parse(localStorage.getItem(MEDICINES_KEY) || '[]');
}

function saveMedicines(medicines) {
    localStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
}

// --- Prescription Management ---
function getPrescriptions() {
    return JSON.parse(localStorage.getItem(PRESCRIPTIONS_KEY) || '[]');
}

function savePrescriptions(prescriptions) {
    localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
}

function syncPrescriptionToPharmacy(patientId, prescriptionData) {
    let prescriptions = getPrescriptions();
    
    const prescription = {
        id: 'PR' + Date.now(),
        patientId: patientId,
        patientName: getPatientName(patientId),
        date: new Date().toISOString(),
        notes: prescriptionData.notes || '',
        status: 'pending', // 'pending', 'processed', 'pending_doctor_review', 'completed', 'cancelled'
        paymentStatus: 'unpaid', // 'unpaid', 'paid'
        items: prescriptionData.items || []
    };
    
    prescriptions.push(prescription);
    savePrescriptions(prescriptions);
    
    // Update patient status in the main queue
    updateQueueStatus(patientId, 'Menunggu Resep');
}


// --- Initialization ---
function initializeSampleData() {
    // Initialize medicines if not present
    if (!localStorage.getItem(MEDICINES_KEY)) {
        const medicines = [
            { id: 'M001', nama: 'Paracetamol 500mg', stok: 150, harga: 5000, golongan: 'Bebas' },
            { id: 'M002', nama: 'Amoxicillin 500mg', stok: 80, harga: 15000, golongan: 'Keras' },
            { id: 'M003', nama: 'Ibuprofen 400mg', stok: 120, harga: 8000, golongan: 'Bebas Terbatas' },
            { id: 'M004', nama: 'Cetirizine 10mg', stok: 90, harga: 12000, golongan: 'Bebas Terbatas' },
            { id: 'M005', nama: 'Omeprazole 20mg', stok: 60, harga: 20000, golongan: 'Keras' }
        ];
        localStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
    }

    // Initialize patient data if not present (for demo)
    if (!localStorage.getItem(PATIENT_DATA_KEY)) {
        const initialData = [{
            linkedUsername: 'pasien',
            patientId: 'P001',
            nama: 'dave',
            alamat: 'Jl. Demo No. 1',
            no_telp: '081234567890',
            status_pasien: 'umum'
        }];
        localStorage.setItem(PATIENT_DATA_KEY, JSON.stringify(initialData));
    }

    // Initialize pending prescriptions if not present (for demo)
    if (!localStorage.getItem(PRESCRIPTIONS_KEY)) {
        const samplePrescriptions = [
            {
                id: 'PR001',
                patientId: 'P001',
                patientName: 'dave',
                date: new Date().toISOString(),
                notes: 'Resep demo untuk testing',
                status: 'processed',
                paymentStatus: 'unpaid',
                items: [
                    { id: 'item_1', medicineId: 'M001', medicineName: 'Paracetamol 500mg', quantity: 2 },
                    { id: 'item_2', medicineId: 'M003', medicineName: 'Ibuprofen 400mg', quantity: 1 }
                ]
            },
            {
                id: 'PR002',
                patientId: 'P001',
                patientName: 'dave',
                date: new Date().toISOString(),
                notes: 'Resep kedua untuk testing',
                status: 'processed',
                paymentStatus: 'unpaid',
                items: [
                    { id: 'item_3', medicineId: 'M002', medicineName: 'Amoxicillin 500mg', quantity: 3 }
                ]
            }
        ];
        savePrescriptions(samplePrescriptions);
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeSampleData();
    });
}


