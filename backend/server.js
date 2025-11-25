// Server Entry Point
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const { ensureEnvFile } = require('./utils/envSetup');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Ensure .env file exists before loading
ensureEnvFile();

// Load env vars
const envResult = dotenv.config();

if (envResult.error) {
    console.warn('⚠️  Warning: Error loading .env file:', envResult.error.message);
    console.log('   Using default/fallback values\n');
}

// Connect to Firebase
connectDB().catch(err => {
    console.error('Failed to connect to Firebase:', err);
    process.exit(1);
});

// Initialize app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
};
app.use(cors(corsOptions));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/doctors', require('./routes/doctors'));

// Health check
app.get('/api/health', async (req, res) => {
    const { getDB, getAuth } = require('./config/database');
    try {
        const db = getDB();
        const auth = getAuth();

        // Simple check if Firebase services are available
        const isDbAvailable = db !== null && db !== undefined;
        const isAuthAvailable = auth !== null && auth !== undefined;

        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            database: {
                status: isDbAvailable && isAuthAvailable ? 'connected' : 'disconnected',
                type: 'Firebase Firestore',
                authentication: 'Firebase Auth'
            }
        });
    } catch (error) {
        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            database: {
                status: 'error',
                error: error.message
            }
        });
    }
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = app;
