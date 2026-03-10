const express = require('express');
const router = express.Router();
const AdminTax = require('../models/AdminTax');

// Get all tax rules
router.get('/', async (req, res) => {
    try {
        const taxes = await AdminTax.find().sort({ lastUpdated: -1 });
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new tax rule
router.post('/', async (req, res) => {
    try {
        const newTax = new AdminTax(req.body);
        await newTax.save();
        res.status(201).json(newTax);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
