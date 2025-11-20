// Doctor Routes
const express = require('express');
const router = express.Router();
const {
    getDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getDoctors)
    .post(authorize('admin'), createDoctor);

router.route('/:id')
    .get(getDoctor)
    .put(authorize('admin'), updateDoctor)
    .delete(authorize('admin'), deleteDoctor);

module.exports = router;

