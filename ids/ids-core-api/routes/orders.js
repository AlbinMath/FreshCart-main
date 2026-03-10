const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create a new order (legacy push from Seller app)
router.post('/', async (req, res) => {
    try {
        // We no longer recreate the order because IDS reads directly from Products.Orders
        // However, we still want to broadcast the event to the IDS dashboard
        const io = req.app.get('io');
        if (io) {
            io.emit('order_created', req.body);
        }

        res.status(200).json({ message: 'Order event received by IDS' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all pending orders (to be clustered)
router.get('/pending', async (req, res) => {
    try {
        const orders = await Order.find({
            status: { $in: ['Ready for Shipping', 'Dispatched', 'Shipped'] },
            deliveryAgentId: { $exists: false }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
router.put('/:order_id/status', async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status } = req.body;

        const order = await Order.findOneAndUpdate(
            { orderId: order_id },
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Broadcast status update
        const io = req.app.get('io');
        if (io) {
            io.emit('order_status_update', { order_id, status });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
