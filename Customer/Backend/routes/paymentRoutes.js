const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const OrderLedger = require('../models/OrderLedger');
const { createGenesisBlock, createNextBlock } = require('../utils/ledgerUtils');
const axios = require('axios');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RL7iTlLIMH8nZY',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rwk1544M3HCWZOAb7E6A2X07'
});

// Create Order (Initialize Razorpay)
router.post('/create-order', async (req, res) => {
    try {
        const { userId, amount } = req.body; // Extract amount passed from frontend

        // Securely fetch cart total just to verify carts exist
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        // Trust the frontend amount which includes dynamic delivery + taxes, 
        // fallback to raw cart sum if not provided.
        const rawCartSum = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const finalAmount = amount || rawCartSum;

        const options = {
            amount: Math.round(finalAmount * 100), // Amount in paise, ensure integer
            currency: "INR",
            receipt: "order_rcptid_" + Date.now()
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID // Send key to frontend
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// Helper: Generate Alphanumeric Order ID
const generateOrderId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ORD-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// ... (Razorpay init code omitted, keeping existing) ...

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
            shippingAddress,
            couponCode
        } = req.body;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {

            // Securely fetch items from Cart (TRUSTED SOURCE)
            const cart = await Cart.findOne({ userId });
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: "Cart not found or empty" });
            }

            // Recalculate Total (Optional but good check)
            const secureTotalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Enrich cart items with storeAddress + preparationTime from Product collection
            const enrichedItems = await Promise.all(cart.items.map(async (item) => {
                const plainItem = item.toObject ? item.toObject() : { ...item };
                try {
                    const prod = await Product.findById(item.productId).select('storeAddress preparationTime').lean();
                    if (prod) {
                        plainItem.storeAddress = prod.storeAddress || '';
                        plainItem.preparationTime = prod.preparationTime || '';
                    }
                } catch { /* skip enrichment on error */ }
                return plainItem;
            }));

            // Create Order in DB
            const newOrder = new Order({
                userId,
                orderId: generateOrderId(),
                items: enrichedItems,
                totalAmount: totalAmount || secureTotalAmount,
                shippingAddress,
                taxDetails: req.body.taxDetails,
                paymentStatus: 'Paid',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                status: 'Placed'
            });

            await newOrder.save();

            // Push order to IDS for clustering
            try {
                if (shippingAddress && shippingAddress.latitude && shippingAddress.longitude) {
                    await axios.post(`${process.env.IDS_CORE_API_URL}/api/orders`, {
                        order_id: newOrder.orderId,
                        customer_name: shippingAddress.name || 'Customer',
                        location: {
                            type: 'Point',
                            coordinates: [shippingAddress.longitude, shippingAddress.latitude]
                        },
                        priority: 1, // Standard for online
                        volume: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
                    });
                    console.log(`[IDS] Order ${newOrder.orderId} forwarded successfully`);
                }
            } catch (idsErr) {
                console.error(`[IDS] Error forwarding order:`, idsErr.message);
            }

            // ORDER_INTEGRITY: Create Genesis Block + Payment Verified Block
            try {
                // 1. Genesis Block
                let ledger = await createGenesisBlock(newOrder.orderId, userId);

                // 2. Payment Verified Block
                const genesisBlock = ledger.chain[0];
                const paymentBlock = await createNextBlock(
                    genesisBlock,
                    "PAYMENT_VERIFIED",
                    "SYSTEM",
                    "PAYMENT_GATEWAY",
                    {
                        method: "Online",
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id
                    }
                );

                ledger.chain.push(paymentBlock);
                ledger.currentHash = paymentBlock.hash;

                // Save Chain
                await new OrderLedger(ledger).save();
                console.log(`[OrderIntegrity] Ledger initialized for ${newOrder.orderId}`);
            } catch (chainError) {
                console.error("[OrderIntegrity] Failed to create ledger:", chainError);
                // Non-blocking: Order success should not fail if chain fails
            }

            // Update Stock and Order Count
            for (const item of items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stockQuantity: -item.quantity, orderCount: 1 }
                });
            }

            // Increment Coupon Usage
            if (couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } }
                );
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

// Get All Orders for a User (With Auto-Backfill)
router.get('/user-orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });

        // Backfill Check: If any order lacks an Order ID, generate it now
        let detailedUpdate = false;
        for (const order of orders) {
            if (!order.orderId) {
                order.orderId = generateOrderId();
                await order.save();
                detailedUpdate = true;
            }
        }

        // If we updated ids, we could re-fetch, but 'order' object is mutated in place by mongoose save? 
        // Actually safe to just return 'orders' as the object in memory is updated.

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
            shippingAddress,
            taxDetails,
            couponCode
        } = req.body;

        // Enrich items with storeAddress + preparationTime from Product collection
        const enrichedItems = await Promise.all(items.map(async (item) => {
            const enriched = { ...item };
            try {
                const prod = await Product.findById(item.productId).select('storeAddress preparationTime').lean();
                if (prod) {
                    enriched.storeAddress = prod.storeAddress || '';
                    enriched.preparationTime = prod.preparationTime || '';
                }
            } catch { /* skip enrichment on error */ }
            return enriched;
        }));

        const newOrder = new Order({
            userId,
            orderId: generateOrderId(),
            items: enrichedItems,
            totalAmount,
            shippingAddress,
            taxDetails,
            paymentStatus: 'Pending',
            paymentMethod: 'COD',
            status: 'Placed'
        });

        await newOrder.save();

        // Push order to IDS for clustering
        try {
            if (shippingAddress && shippingAddress.latitude && shippingAddress.longitude) {
                await axios.post(`${process.env.IDS_CORE_API_URL}/api/orders`, {
                    order_id: newOrder.orderId,
                    customer_name: shippingAddress.name || 'Customer',
                    location: {
                        type: 'Point',
                        coordinates: [shippingAddress.longitude, shippingAddress.latitude]
                    },
                    priority: 2, // COD or higher priority manually
                    volume: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
                });
                console.log(`[IDS] COD Order ${newOrder.orderId} forwarded successfully`);
            }
        } catch (idsErr) {
            console.error(`[IDS] Error forwarding order:`, idsErr.message);
        }

        // ORDER_INTEGRITY: Create Genesis Block
        try {
            const ledger = await createGenesisBlock(newOrder.orderId, userId);
            await new OrderLedger(ledger).save();
            console.log(`[OrderIntegrity] Genesis ledger created for COD ${newOrder.orderId}`);
        } catch (chainError) {
            console.error("[OrderIntegrity] Failed to create ledger:", chainError);
        }

        // Update Stock and Order Count
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: -item.quantity, orderCount: 1 }
            });
        }

        // Increment Coupon Usage
        if (couponCode) {
            await Coupon.findOneAndUpdate(
                { code: couponCode.toUpperCase() },
                { $inc: { usedCount: 1 } }
            );
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
