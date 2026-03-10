const express = require('express');
const router = express.Router();
const AdminCustomer = require('../models/AdminCustomer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const customers = await AdminCustomer.find().sort({ registeredAt: -1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a mock customer (for testing/logic building)
router.post('/', async (req, res) => {
    try {
        const newCustomer = new AdminCustomer(req.body);
        await newCustomer.save();
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
