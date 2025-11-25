// Doctor Controller
const Doctor = require('../models/Doctor');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.findAll(true);

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctors',
            error: error.message
        });
    }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Private
exports.getDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor',
            error: error.message
        });
    }
};

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private (Admin)
exports.createDoctor = async (req, res) => {
    try {
        const result = await Doctor.create(req.body);
        const doctor = await Doctor.findById(result.lastID);

        res.status(201).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating doctor',
            error: error.message
        });
    }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.update(req.params.id, req.body);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating doctor',
            error: error.message
        });
    }
};

// @desc    Delete doctor (soft delete)
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
exports.deleteDoctor = async (req, res) => {
    try {
        const deleted = await Doctor.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Doctor deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting doctor',
            error: error.message
        });
    }
};
