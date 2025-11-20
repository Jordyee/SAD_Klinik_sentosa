// Appointment Controller
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
    try {
        const { status, date } = req.query;
        const filters = {};

        if (status) {
            filters.status = status;
        }

        if (date) {
            filters.date = date;
        }

        const appointments = await Appointment.findAll(filters);

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments',
            error: error.message
        });
    }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching appointment',
            error: error.message
        });
    }
};

// @desc    Create appointment (add to queue)
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
    try {
        const { patientId } = req.body;

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const result = await Appointment.create({
            patientId,
            status: 'waiting'
        });
        const appointment = await Appointment.findById(result.lastID);

        res.status(201).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating appointment',
            error: error.message
        });
    }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.update(req.params.id, req.body);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating appointment',
            error: error.message
        });
    }
};

// @desc    Update vitals
// @route   PATCH /api/appointments/:id/vitals
// @access  Private (Perawat)
exports.updateVitals = async (req, res) => {
    try {
        const appointment = await Appointment.updateVitals(req.params.id, req.body);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating vitals',
            error: error.message
        });
    }
};

// @desc    Update consultation
// @route   PATCH /api/appointments/:id/consultation
// @access  Private (Dokter)
exports.updateConsultation = async (req, res) => {
    try {
        const { doctorId, consultation } = req.body;

        const appointment = await Appointment.updateConsultation(req.params.id, {
            doctorId,
            consultation
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating consultation',
            error: error.message
        });
    }
};
