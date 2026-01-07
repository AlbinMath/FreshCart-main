const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders
// Fetch all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
