// Medicine Controller
const Medicine = require('../models/Medicine');

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Private
exports.getMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.findAll(true);

        res.status(200).json({
            success: true,
            count: medicines.length,
            data: medicines
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching medicines',
            error: error.message
        });
    }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Private
exports.getMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching medicine',
            error: error.message
        });
    }
};

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private (Admin, Apotek)
exports.createMedicine = async (req, res) => {
    try {
        const result = await Medicine.create(req.body);
        const medicine = await Medicine.findById(result.lastID);

        res.status(201).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating medicine',
            error: error.message
        });
    }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private (Admin, Apotek)
exports.updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.update(req.params.id, req.body);

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating medicine',
            error: error.message
        });
    }
};

// @desc    Delete medicine (soft delete)
// @route   DELETE /api/medicines/:id
// @access  Private (Admin, Apotek)
exports.deleteMedicine = async (req, res) => {
    try {
        const deleted = await Medicine.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Medicine deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting medicine',
            error: error.message
        });
    }
};

// @desc    Update stock
// @route   PATCH /api/medicines/:id/stock
// @access  Private (Admin, Apotek)
exports.updateStock = async (req, res) => {
    try {
        const { quantity, operation } = req.body; // operation: 'add', 'subtract', or 'set'

        const medicine = await Medicine.updateStock(req.params.id, quantity, operation || 'set');

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating stock',
            error: error.message
        });
    }
};
