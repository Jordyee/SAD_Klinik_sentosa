// Prescription Controller
const Prescription = require('../models/Prescription');

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
exports.getPrescriptions = async (req, res) => {
    try {
        const { status, patientId } = req.query;
        const filters = {};

        if (status) {
            filters.status = status;
        }

        if (patientId) {
            filters.patientId = parseInt(patientId);
        }

        const prescriptions = await Prescription.findAll(filters);

        res.status(200).json({
            success: true,
            count: prescriptions.length,
            data: prescriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching prescriptions',
            error: error.message
        });
    }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
exports.getPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching prescription',
            error: error.message
        });
    }
};

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Dokter)
exports.createPrescription = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentId, items, notes } = req.body;

        const result = await Prescription.create({
            patientId: parseInt(patientId),
            doctorId: doctorId ? parseInt(doctorId) : null,
            appointmentId: appointmentId ? parseInt(appointmentId) : null,
            items,
            notes
        });
        const prescription = await Prescription.findById(result.lastID);

        res.status(201).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating prescription',
            error: error.message
        });
    }
};

// @desc    Process prescription (pharmacy)
// @route   PATCH /api/prescriptions/:id/process
// @access  Private (Apotek)
exports.processPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.process(req.params.id, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Prescription processed successfully',
            data: prescription
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('already processed') ? 400 :
                          error.message.includes('Insufficient') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error processing prescription',
            error: error.message
        });
    }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Dokter)
exports.updatePrescription = async (req, res) => {
    try {
        const prescription = await Prescription.update(req.params.id, req.body);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating prescription',
            error: error.message
        });
    }
};
