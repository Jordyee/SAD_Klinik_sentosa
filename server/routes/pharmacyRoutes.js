const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');

router.get('/medicines', pharmacyController.getMedicines);
router.post('/medicines', pharmacyController.addMedicine);
router.put('/medicines/:id', pharmacyController.updateMedicine);

router.get('/prescriptions/pending', pharmacyController.getPendingPrescriptions);
router.post('/prescriptions/process', pharmacyController.processPrescription);
router.get('/prescriptions/ready', pharmacyController.getReadyPrescriptions);
router.post('/prescriptions/handover', pharmacyController.completeHandover);
router.get('/history', pharmacyController.getPharmacyHistory);

module.exports = router;
