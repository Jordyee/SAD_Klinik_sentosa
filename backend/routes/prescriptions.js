// Prescription Routes
const express = require('express');
const router = express.Router();
const {
    getPrescriptions,
    getPrescription,
    createPrescription,
    updatePrescription,
    processPrescription
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getPrescriptions)
    .post(authorize('dokter', 'admin'), createPrescription);

router.route('/:id')
    .get(getPrescription)
    .put(authorize('dokter', 'admin'), updatePrescription);

router.route('/:id/process')
    .patch(authorize('apotek', 'admin'), processPrescription);

module.exports = router;

