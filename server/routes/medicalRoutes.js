const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medicalController');

router.post('/', medicalController.createMedicalRecord);
router.get('/patient/:patientId', medicalController.getMedicalRecordsByPatient);

module.exports = router;
