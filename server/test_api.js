const http = require('http');

const post = (path, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`[POST] ${path} Status: ${res.statusCode}`);
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error(`Failed to parse JSON from ${path}. Body: ${body}`);
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
};

const get = (path) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`[GET] ${path} Status: ${res.statusCode}`);
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error(`Failed to parse JSON from ${path}. Body: ${body}`);
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
};

const runTests = async () => {
    try {
        console.log('--- Starting Integration Tests ---');

        // 1. Register User
        console.log('\n1. Registering Admin...');
        const adminUser = { username: 'admin', password: 'password', role: 'admin', fullName: 'Admin User', email: 'admin@example.com' };
        // Note: If user already exists, this might return 400, which is fine, but we need to handle it.
        const regRes = await post('/auth/register', adminUser);
        console.log('Register Result:', regRes);

        // 2. Login
        console.log('\n2. Logging in...');
        const loginRes = await post('/auth/login', { username: 'admin', password: 'password', role: 'admin' });
        console.log('Login Result:', loginRes);

        // 3. Register Patient
        console.log('\n3. Registering Patient...');
        const patientData = { nik: '1234567890', name: 'John Doe', address: '123 Main St', phone: '08123456789', dob: '1990-01-01', gender: 'L', insuranceType: 'Umum' };
        const patRes = await post('/patients', patientData);
        console.log('Patient Register Result:', patRes);

        let patientId = patRes.patient ? patRes.patient.id : null;
        if (!patientId && patRes.message && patRes.message.includes('already exists')) {
            // Try to find the patient if already exists (not implemented in this script but let's assume we can proceed or just fail gracefully)
            console.log('Patient already exists, skipping creation.');
            // In a real test we would fetch the patient. For now let's just use a hardcoded ID or skip.
        }

        if (patientId) {
            // 4. Create Visit
            console.log('\n4. Creating Visit...');
            const visitRes = await post('/patients/visits', { patientId });
            console.log('Visit Result:', visitRes);
            const visitId = visitRes.visit ? visitRes.visit.id : null;

            if (visitId) {
                // 5. Add Medicine (Setup)
                console.log('\n5. Adding Medicine...');
                const medRes = await post('/pharmacy/medicines', { name: 'Paracetamol', category: 'Obat Bebas', stock: 100, price: 5000, unit: 'Strip' });
                console.log('Add Medicine Result:', medRes);
                const medId = medRes.medicine ? medRes.medicine.id : null;

                // 6. Create Medical Record
                console.log('\n6. Creating Medical Record...');
                const recordData = {
                    visitId,
                    patientId,
                    doctorId: 'doc1', // Mock ID
                    vitals: { height: 170, weight: 70, bloodPressure: '120/80', temperature: 36.5 },
                    diagnosis: 'Flu',
                    notes: 'Rest and drink water',
                    prescription: medId ? [{ medicineId: medId, quantity: 2, instructions: '3x1' }] : []
                };
                const recRes = await post('/medical-records', recordData);
                console.log('Medical Record Result:', recRes);

                // 7. Process Prescription
                console.log('\n7. Processing Prescription...');
                const pharmRes = await post('/pharmacy/prescriptions/process', { visitId });
                console.log('Pharmacy Process Result:', pharmRes);

                // 8. Pay Bill
                console.log('\n8. Paying Bill...');
                // Get pending billings first to calculate amount
                const pendingBills = await get('/billing/pending');
                const bill = pendingBills.find(b => b.visitId === visitId);

                if (bill) {
                    const payRes = await post('/billing/pay', {
                        visitId,
                        totalAmount: bill.totalAmount,
                        items: bill.details,
                        paymentMethod: 'Cash'
                    });
                    console.log('Payment Result:', payRes);
                } else {
                    console.log('No pending bill found for this visit');
                }
            }
        }

        console.log('\n--- Tests Completed ---');

    } catch (err) {
        console.error('Test Failed:', err);
    }
};

runTests();
