const router = require('express').Router();
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Order = require('../models/Order');
const Seller = require('../models/Seller');

// Create a withdrawal request
router.post('/request', async (req, res) => {
    try {
        const { sellerId, amount, bankDetails } = req.body;

        if (!sellerId || !amount) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // 1. Fetch seller for name
        const seller = await Seller.findById(sellerId);
        if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

        // 2. Calculate Total Revenue (Delivered Orders)
        const deliveredOrders = await Order.find({
            "items.sellerId": sellerId,
            status: 'Delivered'
        });

        const totalRevenue = deliveredOrders.reduce((sum, order) => {
            const sellerItems = order.items.filter(item => item.sellerId === sellerId);
            return sum + sellerItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        }, 0);

        // 3. Calculate already withdrawn amount
        const previousWithdrawals = await WithdrawalRequest.find({
            sellerId,
            status: { $in: ['Approved', 'Pending'] }
        });

        const totalWithdrawn = previousWithdrawals.reduce((sum, w) => sum + w.amount, 0);

        const availableBalance = totalRevenue - totalWithdrawn;

        if (amount > availableBalance) {
            return res.status(400).json({ 
                success: false, 
                message: "Insufficient balance", 
                availableBalance 
            });
        }

        // 4. Create request
        const newRequest = new WithdrawalRequest({
            sellerId,
            sellerName: seller.storeName || seller.name || 'Seller',
            sellerUniqueId: seller.sellerUniqueId,
            amount,
            bankDetails: bankDetails || {
                accountHolderName: seller.bankAccountHolderName,
                accountNumber: seller.bankAccountNumber,
                ifscCode: seller.ifscCode,
                upiId: seller.upiId
            }
        });

        await newRequest.save();

        res.status(201).json({ 
            success: true, 
            message: "Withdrawal request submitted successfully", 
            request: newRequest 
        });

    } catch (err) {
        console.error("Error creating withdrawal request:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Get withdrawal requests for a seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const requests = await WithdrawalRequest.find({ sellerId }).sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (err) {
        console.error("Error fetching withdrawal requests:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
