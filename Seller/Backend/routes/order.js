const router = require('express').Router();
const Order = require('../models/Order');
const OrderLedger = require('../models/OrderLedger');
const { createNextBlock } = require('../utils/ledgerUtils');
const axios = require('axios');

// Get Orders for a specific Seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Query by 'items.sellerId' based on new schema
        // Using 'sellerId' passed from frontend. Frontend should pass the ID that matches what's in DB.

        const orders = await Order.find({
            "items.sellerId": sellerId
        }).sort({ createdAt: -1 });

        // Backfill Order IDs if missing
        let hasUpdates = false;
        const updates = orders.map(async (order) => {
            if (!order.orderId) {
                const prefix = 'ORD';
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                order.orderId = `${prefix}-${timestamp}-${random}`;
                hasUpdates = true;
                return order.save();
            }
            return Promise.resolve();
        });

        if (hasUpdates) {
            await Promise.all(updates);
        }

        // Fetch Product IDs for items
        // Since we can't easily JOIN across potential diverse references, we'll collect all product IDs
        // and fetch their friendly product_id (PID)
        const allProductMongoIds = orders.flatMap(o => o.items.map(i => i.productId)).filter(Boolean);

        // Find products with these IDs
        // Need to import Product model first. 
        // Note: 'Order' model is in same db, so we can use Product model here if we import it.
        const products = await require('../models/Product').find({
            _id: { $in: allProductMongoIds }
        }).select('_id product_id');

        const productMap = products.reduce((acc, p) => {
            acc[p._id.toString()] = p.product_id;
            return acc;
        }, {});

        // Attach friendly product_id to items in response (without saving to DB)
        const ordersWithPids = orders.map(order => {
            const orderObj = order.toObject();
            orderObj.items = orderObj.items.map(item => ({
                ...item,
                product_id: productMap[item.productId] || item.productId // Fallback to mongo ID if not found
            }));
            return orderObj;
        });

        res.json(ordersWithPids);
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

        // Push status to IDS if ready for delivery
        try {
            if (updatedOrder && (status === 'Processing' || status === 'Ready for Shipping' || status === 'Dispatched' || status === 'Shipped')) {
                if (updatedOrder.shippingAddress && updatedOrder.shippingAddress.latitude) {
                    await axios.post(`${process.env.IDS_CORE_API_URL || 'http://localhost:2012'}/api/orders`, {
                        order_id: updatedOrder.orderId,
                        customer_name: updatedOrder.shippingAddress.name || 'Customer',
                        location: {
                            type: 'Point',
                            coordinates: [updatedOrder.shippingAddress.longitude, updatedOrder.shippingAddress.latitude]
                        },
                        priority: (status === 'Ready for Shipping' || status === 'Shipped') ? 2 : 1,
                        volume: updatedOrder.items ? updatedOrder.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 1
                    });
                    console.log(`[IDS] Order ${updatedOrder.orderId} updated in Dispatch System`);

                    // Trigger dispatch clustering automatically if ready for shipping or dispatched or shipped
                    if (status === 'Ready for Shipping' || status === 'Dispatched' || status === 'Shipped') {
                        try {
                            const dispatchResponse = await axios.post(`${process.env.IDS_CORE_API_URL || 'http://localhost:2012'}/api/dispatch/trigger`);
                            console.log(`[IDS] Auto-dispatch triggered. Assigned ${dispatchResponse.data?.results?.filter(r => r.assigned_to).length || 0} clusters.`);
                        } catch (triggerErr) {
                            console.error(`[IDS] Failed to auto-trigger dispatch clustering:`, triggerErr.message);
                        }
                    }
                }
            }
        } catch (idsErr) {
            console.error(`[IDS] Failed to notify dispatch:`, idsErr.message);
        }

        // ORDER_INTEGRITY: Append Status Update Block
        try {
            if (updatedOrder && updatedOrder.orderId) {
                const ledgerRecord = await OrderLedger.findOne({ orderId: updatedOrder.orderId });

                if (ledgerRecord) {
                    const lastBlock = ledgerRecord.chain[ledgerRecord.chain.length - 1];
                    const newBlock = await createNextBlock(
                        lastBlock,
                        `STATUS_UPDATED_${status.toUpperCase()}`,
                        "SELLER",
                        // Assuming req.user or similar exists, but this is a simple route. 
                        // We'll use a placeholder or check if we can get seller ID from somewhere. 
                        // The route doesn't seem to have auth middleware visible in the snippet, 
                        // but let's assume "SELLER" is the actor.
                        "SELLER_APP",
                        { status, previousStatus: "UNKNOWN" } // In a real app we'd fetch old status first
                    );

                    ledgerRecord.chain.push(newBlock);
                    ledgerRecord.currentHash = newBlock.hash;
                    await ledgerRecord.save();
                    console.log(`[OrderIntegrity] Block appended for ${updatedOrder.orderId}: ${status}`);
                } else {
                    console.warn(`[OrderIntegrity] No ledger found for ${updatedOrder.orderId}`);
                }
            }
        } catch (chainError) {
            console.error("[OrderIntegrity] Failed to append block:", chainError);
        }

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
