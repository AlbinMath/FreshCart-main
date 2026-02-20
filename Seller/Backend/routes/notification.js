const router = require('express').Router();
const Notification = require('../models/Notification');
const Product = require('../models/Product'); // To check stock

// Sync and Get Notifications
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;

        // 1. Fetch current low stock products (active only?)
        // Assuming sellerUniqueId is consistent, but here we have sellerId (ObjectId?).
        // Product model uses 'sellerUniqueId' mostly, but also has 'sellerId' (ObjectId).
        // Let's use 'sellerUniqueId' if possible, but the route param is usually sellerId.
        // Let's check Product model... it has generic 'sellerId' and 'sellerUniqueId'.

        // Let's first get the User to find their uniqueId? 
        // Or just query Product by sellerId (ObjectId) if that's consistent.
        // File 28 (Product.js) shows: sellerId: {type: ObjectId, required: true}

        // Find products for this seller linked to low stock
        // We need to support the custom 'lowStockThreshold' field, defaulting to 10 if missing (though schema default handles new docs)
        // But for existing docs, it might be missing.

        const products = await Product.find({
            sellerId: sellerId,
            status: 'active'
        });

        // 2. Identify Low Stock Products
        const lowStockProducts = products.filter(p => {
            const threshold = p.lowStockThreshold !== undefined ? p.lowStockThreshold : 10;
            return p.stockQuantity <= threshold;
        });

        // 3. Sync Notifications
        // a) Ensure every low stock product has a notification
        for (const p of lowStockProducts) {
            const exists = await Notification.findOne({
                sellerId,
                productId: p._id,
                type: 'low_stock'
            });

            if (!exists) {
                await Notification.create({
                    sellerId,
                    productId: p._id,
                    type: 'low_stock',
                    message: `Low Stock Alert: ${p.productName} is down to ${p.stockQuantity} ${p.unit}.`,
                    isRead: false
                });
            }
        }

        // b) Remove notifications for products that are NO LONGER low stock
        // (e.g. restocked)
        const allNotifications = await Notification.find({ sellerId, type: 'low_stock' });

        for (const notif of allNotifications) {
            // Find corresponding product
            const p = products.find(prod => prod._id.toString() === notif.productId?.toString());

            if (!p) {
                // Product deleted? Remove notification
                await Notification.findByIdAndDelete(notif._id);
                continue;
            }

            const threshold = p.lowStockThreshold !== undefined ? p.lowStockThreshold : 10;
            if (p.stockQuantity > threshold) {
                // Restocked, remove notification (even if read, so it can re-trigger later)
                await Notification.findByIdAndDelete(notif._id);
            }
        }

        // 4. Return Active (Unread) Notifications
        const activeNotifications = await Notification.find({
            sellerId,
            isRead: false
        }).sort({ createdAt: -1 });

        res.json(activeNotifications);

    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

// Clear Notification (Mark as Read)
router.put('/:id/clear', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );
        res.json(notification);
    } catch (err) {
        console.error("Error clearing notification:", err);
        res.status(500).json({ message: "Failed to clear notification" });
    }
});

module.exports = router;
