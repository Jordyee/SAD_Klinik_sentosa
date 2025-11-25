const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.get('/pending', billingController.getPendingBillings);
router.post('/pay', billingController.createTransaction);
router.get('/reports', billingController.getReports);

module.exports = router;
