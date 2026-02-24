const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create a new order
router.post('/', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();

        // Broadcast new order to connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('order_created', order);
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all pending orders (to be clustered)
router.get('/pending', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'pending' });
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
            { order_id },
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
