const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Patient Routes
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', patientController.createPatient);

// Visit Routes (grouped here for convenience, or could be separate)
router.post('/visits', patientController.createVisit);
router.get('/visits/active', patientController.getActiveVisits);
router.put('/visits/:id/status', patientController.updateVisitStatus);

module.exports = router;
