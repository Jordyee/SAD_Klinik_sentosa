// Appointment Routes
const express = require('express');
const router = express.Router();
const {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    updateVitals,
    updateConsultation
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getAppointments)
    .post(createAppointment);

router.route('/:id')
    .get(getAppointment)
    .put(updateAppointment);

router.route('/:id/vitals')
    .patch(authorize('perawat', 'admin'), updateVitals);

router.route('/:id/consultation')
    .patch(authorize('dokter', 'admin'), updateConsultation);

module.exports = router;

