// Medicine Routes
const express = require('express');
const router = express.Router();
const {
    getMedicines,
    getMedicine,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    updateStock
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getMedicines)
    .post(authorize('admin', 'apotek'), createMedicine);

router.route('/:id')
    .get(getMedicine)
    .put(authorize('admin', 'apotek'), updateMedicine)
    .delete(authorize('admin', 'apotek'), deleteMedicine);

router.route('/:id/stock')
    .patch(authorize('admin', 'apotek'), updateStock);

module.exports = router;

