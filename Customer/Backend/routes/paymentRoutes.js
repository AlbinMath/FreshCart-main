const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order (Initialize Razorpay)
router.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ success: false, message: "Payment initialization failed", error: error.message });
    }
});

// Verify Payment and Create Order in DB
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            items,
            totalAmount,
            shippingAddress
        } = req.body;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Create Order in DB
            const newOrder = new Order({
                userId,
                items,
                totalAmount,
                shippingAddress,
                paymentStatus: 'Paid',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                status: 'Placed'
            });

            await newOrder.save();

            // Update Stock and Order Count
            for (const item of items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stockQuantity: -item.quantity, orderCount: 1 }
                });
            }

            // Clear User's Cart
            await Cart.findOneAndDelete({ userId });

            res.json({ success: true, message: "Payment verified and order placed", orderId: newOrder._id });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Verification failed" });
    }
});

// Get Order Details
router.get('/order/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get All Orders for a User
router.get('/user-orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Place Cash on Delivery Order
router.post('/place-cod-order', async (req, res) => {
    try {
        const {
            userId,
            items,
            totalAmount,
            shippingAddress
        } = req.body;

        const newOrder = new Order({
            userId,
            items,
            totalAmount,
            shippingAddress,
            paymentStatus: 'Pending',
            paymentMethod: 'COD',
            status: 'Placed'
        });

        await newOrder.save();

        // Update Stock and Order Count
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: -item.quantity, orderCount: 1 }
            });
        }

        // Clear User's Cart
        await Cart.findOneAndDelete({ userId });

        res.json({ success: true, message: "Order placed successfully", orderId: newOrder._id });

    } catch (error) {
        console.error("Error placing COD order:", error);
        res.status(500).json({ success: false, message: "Order placement failed" });
    }
});

// Cancel Order
router.put('/cancel-order', async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.status === 'Cancelled') return res.status(400).json({ success: false, message: "Order is already cancelled" });

        // Update status
        order.status = 'Cancelled';
        await order.save();

        // Restore Stock (Optional but recommended)
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: item.quantity, orderCount: -1 }
            });
        }

        res.json({ success: true, message: "Order cancelled successfully", order });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Cancellation failed" });
    }
});

module.exports = router;
