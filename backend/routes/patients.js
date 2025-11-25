// Patient Routes
const express = require('express');
const router = express.Router();
const {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getPatients)
    .post(createPatient);

router.route('/search')
    .get(searchPatients);

router.route('/:id')
    .get(getPatient)
    .put(updatePatient)
    .delete(protect, authorize('admin'), deletePatient);

module.exports = router;

