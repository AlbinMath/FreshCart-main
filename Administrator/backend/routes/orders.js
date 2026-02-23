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

// POST /api/orders/trigger-dispatch
// Manually triggers the IDS machine learning dispatch system
router.post('/trigger-dispatch', async (req, res) => {
    try {
        const idsUrl = process.env.IDS_CORE_API_URL || 'http://localhost:2012';
        const axios = require('axios');

        const response = await axios.post(`${idsUrl}/api/dispatch/trigger`);

        res.json({
            success: true,
            message: 'Dispatch sequence initiated successfully',
            results: response.data
        });
    } catch (err) {
        console.error('[IDS] Error triggering dispatch from Admin:', err.message);
        res.status(500).json({ success: false, message: 'Failed to trigger dispatch system', error: err.message });
    }
});

module.exports = router;
