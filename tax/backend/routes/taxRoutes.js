const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

// Calculate Tax for an Order
router.post('/calculate', taxController.calculateTax);

// Get current Tax Rules/Slabs
router.get('/rules', taxController.getTaxRules);

// Validate GSTIN (Mock)
router.post('/validate-gstin', taxController.validateGstin);

module.exports = router;
