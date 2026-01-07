const router = require('express').Router();
const Order = require('../models/Order');

// Get Orders for a specific Seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Query by 'items.sellerId' based on new schema
        // Using 'sellerId' passed from frontend. Frontend should pass the ID that matches what's in DB.

        const orders = await Order.find({
            "items.sellerId": sellerId
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

// Get Pending Order Count for Sidebar
router.get('/count/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;

        const count = await Order.countDocuments({
            "items.sellerId": sellerId,
            "status": "Pending" // Only count pending orders
        });

        res.json({ count });
    } catch (err) {
        console.error("Error fetching order count:", err);
        res.status(500).json({ message: "Failed to fetch count" });
    }
});

// Update Order Status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(updatedOrder);
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: "Failed to update status" });
    }
});

module.exports = router;
