const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve frontend files

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicalRoutes = require('./routes/medicalRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const billingRoutes = require('./routes/billingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/billing', billingRoutes);
// app.use('/api/pharmacy', pharmacyRoutes);
// app.use('/api/billing', billingRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Klinik Sentosa API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
