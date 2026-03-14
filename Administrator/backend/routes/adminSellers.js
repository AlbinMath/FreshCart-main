const express = require('express');
const router = express.Router();
const AdminSeller = require('../models/AdminSeller');

// Get all sellers
router.get('/', async (req, res) => {
    try {
        const sellers = await AdminSeller.find().sort({ joinedAt: -1 });
        res.json(sellers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single seller details
router.get('/:id', async (req, res) => {
    try {
        const Seller = require('../models/Seller');
        const seller = await Seller.findById(req.params.id);
        if (!seller) return res.status(404).json({ message: 'Seller not found' });
        res.json(seller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a mock seller (for testing/logic building)
router.post('/', async (req, res) => {
    try {
        const newSeller = new AdminSeller(req.body);
        await newSeller.save();
        res.status(201).json(newSeller);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
