// Data Integration Helper
// Ensures data flows correctly between modules

// Initialize sample data if localStorage is empty
function initializeSampleData() {
    // Check if data already exists
    if (localStorage.getItem('medicines')) {
        return; // Data already exists
    }
    
    // Initialize medicines
    const medicines = [
        { id: 'M001', nama: 'Paracetamol 500mg', stok: 150, harga: 5000 },
        { id: 'M002', nama: 'Amoxicillin 500mg', stok: 80, harga: 15000 },
        { id: 'M003', nama: 'Ibuprofen 400mg', stok: 120, harga: 8000 },
        { id: 'M004', nama: 'Cetirizine 10mg', stok: 90, harga: 12000 },
        { id: 'M005', nama: 'Omeprazole 20mg', stok: 60, harga: 20000 }
    ];
    
    localStorage.setItem('medicines', JSON.stringify(medicines));
}

// Sync prescription from examination to pharmacy
function syncPrescriptionToPharmacy(patientId, prescriptionData) {
    const prescriptions = JSON.parse(localStorage.getItem('pendingPrescriptions') || '[]');
    
    const prescription = {
        id: 'PR' + Date.now(),
        patientId: patientId,
        patientName: getPatientName(patientId),
        date: new Date().toISOString(),
        notes: prescriptionData.notes || '',
        status: 'pending',
        items: prescriptionData.items || []
    };
    
    prescriptions.push(prescription);
    localStorage.setItem('pendingPrescriptions', JSON.stringify(prescriptions));
}

// Get patient name by ID
function getPatientName(patientId) {
    const savedQueue = localStorage.getItem('patientQueue');
    if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        const patient = queue.find(item => item.patient.id === patientId);
        if (patient) {
            return patient.patient.nama;
        }
    }
    return 'Unknown Patient';
}

// Get patient data
function getPatientData(patientId) {
    const savedQueue = localStorage.getItem('patientQueue');
    if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        const patient = queue.find(item => item.patient.id === patientId);
        if (patient) {
            return patient.patient;
        }
    }
    return null;
}

// Initialize on page load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeSampleData();
    });
}


