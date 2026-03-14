const express = require('express');
const router = express.Router();
const { customerConn, productsConn } = require('../config/db');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Define Models for existing schemas across different DBs
const c2bOrderSchemaOptions = require('../../../Shared/OrderIntegrity/models/C2B_OrderSchema');
const C2B_Order = customerConn.models.C2B_Order || customerConn.model('C2B_Order', c2bOrderSchemaOptions(mongoose));

const withdrawalRequestSchema = require('../../../Customer/Backend/models/WithdrawalRequest');
const WithdrawalRequest = customerConn.models.WithdrawalRequest || customerConn.model('WithdrawalRequest', withdrawalRequestSchema);

// Seller Withdrawal Schema (matching the one in Seller Backend)
const sellerWithdrawalSchema = new mongoose.Schema({
    sellerId: String,
    sellerName: String,
    sellerUniqueId: String,
    amount: Number,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        upiId: String
    },
    transactionId: String,
    adminNote: String,
    processedDate: Date
}, { timestamps: true, collection: 'SellerWithdrawals' });

const SellerWithdrawalRequest = mongoose.models.SellerWithdrawalRequest || mongoose.model('SellerWithdrawalRequest', sellerWithdrawalSchema);

// Delivery Withdrawal Schema (matching the one in Delivery Backend)
const deliveryWithdrawalSchema = new mongoose.Schema({
    agentId: String,
    agentName: String,
    amount: Number,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        upiId: String
    },
    adminNote: String,
    transactionId: String,
    processedDate: Date
}, { timestamps: true, collection: 'DeliveryWithdrawalRequests' });

const DeliveryWithdrawalRequest = mongoose.models.DeliveryWithdrawalRequest || mongoose.model('DeliveryWithdrawalRequest', deliveryWithdrawalSchema);

const Notification = require('../models/Notification');

// User/Customer model for names (from Users DB - default mongoose connection)
const userSchema = new mongoose.Schema({
    uid: String,
    name: String,
    email: String
}, { collection: 'Customer' });
const User = mongoose.models.Customer || mongoose.model('Customer', userSchema);

// Reuse Seller Order Schema if possible, or define a subset for history
const sellerOrderSchema = new mongoose.Schema({
    items: [{ productName: String, price: Number, quantity: Number, sellerId: String }],
    orderId: String,
    userId: String,
    totalAmount: Number,
    paymentStatus: String,
    paymentMethod: String,
    status: String,
    shippingStatus: String,
    createdAt: Date
}, { timestamps: true, collection: 'Orders' });
const SellerOrder = productsConn.models.Orders || productsConn.model('Orders', sellerOrderSchema);

// 1. Get all withdrawal requests
router.get('/withdrawal-requests', async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find().sort({ createdAt: -1 }).lean();
        
        // Fetch user names for each request
        const enrichedRequests = await Promise.all(requests.map(async (r) => {
            const user = await User.findOne({ uid: r.userId }).select('name').lean();
            return {
                ...r,
                userName: user ? user.name : 'Unknown User'
            };
        }));

        res.status(200).json({ success: true, requests: enrichedRequests });
    } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 1.1 Get all SELLER withdrawal requests
router.get('/seller-withdrawals', async (req, res) => {
    try {
        const requests = await SellerWithdrawalRequest.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching seller withdrawal requests:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 1.2 Get all DELIVERY withdrawal requests
router.get('/delivery-withdrawals', async (req, res) => {
    try {
        const requests = await DeliveryWithdrawalRequest.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching delivery withdrawal requests:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. Approve/Reject withdrawal request
router.put('/withdrawal-requests/:id', async (req, res) => {
    try {
        const { status, adminNote, transactionId } = req.body;
        const request = await WithdrawalRequest.findById(req.params.id);
        
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        request.status = status;
        if (adminNote) request.adminNote = adminNote;
        if (transactionId) request.transactionId = transactionId;
        request.processedDate = Date.now();

        await request.save();

        // Create notification log for Admin
        try {
            await Notification.create({
                title: `Withdrawal ${status}`,
                message: `You have ${status.toLowerCase()}ed the withdrawal request for ₹${request.amount} (Grower ID: ${request.userId}).`,
                type: status === 'Approved' ? 'success' : 'error',
                metadata: { withdrawalId: request._id, userId: request.userId }
            });
        } catch (nError) {
            console.error('Failed to create notification log:', nError);
        }

        res.status(200).json({ success: true, message: `Request ${status}`, request });
    } catch (error) {
        console.error('Error updating withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2.1 Approve/Reject SELLER withdrawal request
router.put('/seller-withdrawals/:id', async (req, res) => {
    try {
        const { status, adminNote, transactionId } = req.body;
        const request = await SellerWithdrawalRequest.findById(req.params.id);
        
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        request.status = status;
        if (adminNote) request.adminNote = adminNote;
        if (transactionId) request.transactionId = transactionId;
        request.processedDate = Date.now();

        await request.save();

        res.status(200).json({ success: true, message: `Seller Payout ${status}`, request });
    } catch (error) {
        console.error('Error updating seller withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2.2 Approve/Reject DELIVERY withdrawal request
router.put('/delivery-withdrawals/:id', async (req, res) => {
    try {
        const { status, adminNote, transactionId } = req.body;
        const request = await DeliveryWithdrawalRequest.findById(req.params.id);
        
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        request.status = status;
        if (adminNote) request.adminNote = adminNote;
        if (transactionId) request.transactionId = transactionId;
        request.processedDate = Date.now();

        await request.save();

        res.status(200).json({ success: true, message: `Delivery Payout ${status}`, request });
    } catch (error) {
        console.error('Error updating delivery withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2.5 Revert withdrawal request to Pending
router.put('/withdrawal-requests/:id/revert', async (req, res) => {
    try {
        const request = await WithdrawalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        request.status = 'Pending';
        request.processedDate = undefined;
        request.transactionId = undefined;
        // Optionally keep the adminNote but prefix it
        request.adminNote = `[REVERTED] ${request.adminNote || ''}`;

        await request.save();
        res.status(200).json({ success: true, message: 'Request reverted to Pending', request });
    } catch (error) {
        console.error('Error reverting withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2.6 Delete withdrawal request
router.delete('/withdrawal-requests/:id', async (req, res) => {
    try {
        const request = await WithdrawalRequest.findByIdAndDelete(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        res.status(200).json({ success: true, message: 'Request deleted permanently' });
    } catch (error) {
        console.error('Error deleting withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. Get consolidated transaction history
router.get('/history', async (req, res) => {
    try {
        // Fetch Seller/Customer (B2C) Orders
        const b2cOrders = await SellerOrder.find().sort({ createdAt: -1 }).limit(50);
        
        // Fetch Grower/Sourcing (C2B) Orders
        const c2bOrders = await C2B_Order.find().sort({ createdAt: -1 }).limit(50);

        // Fetch Withdrawals (All types)
        const withdrawals = await WithdrawalRequest.find({ status: 'Approved' }).sort({ createdAt: -1 }).limit(50);
        const sellerWithdrawals = await SellerWithdrawalRequest.find({ status: 'Approved' }).sort({ createdAt: -1 }).limit(50);
        const deliveryWithdrawals = await DeliveryWithdrawalRequest.find({ status: 'Approved' }).sort({ createdAt: -1 }).limit(50);

        // Standardize format for history and fetch names
        const enrichedHistory = await Promise.all([
            ...b2cOrders.map(async (o) => {
                const user = await User.findOne({ uid: o.userId }).select('name').lean();
                return {
                    id: o._id,
                    orderId: o.orderId,
                    type: 'B2C Order',
                    amount: o.totalAmount,
                    entity: o.userId,
                    userName: user ? user.name : 'Unknown',
                    status: o.paymentStatus,
                    shippingStatus: o.shippingStatus || 'Pending',
                    method: o.paymentMethod,
                    date: o.createdAt
                };
            }),
            ...c2bOrders.map(async (o) => {
                const user = await User.findOne({ uid: o.customer_id }).select('name').lean();
                return {
                    id: o._id,
                    orderId: o.c2bOrderId,
                    type: 'C2B Purchase',
                    amount: o.agreedPrice,
                    entity: o.customer_id,
                    userName: user ? user.name : 'Unknown',
                    status: o.paymentStatus,
                    method: o.paymentMethod || 'Online',
                    date: o.createdAt
                };
            }),
            ...withdrawals.map(async (w) => {
                const user = await User.findOne({ uid: w.userId }).select('name').lean();
                return {
                    id: w._id,
                    type: 'Withdrawal',
                    amount: w.amount,
                    entity: w.userId,
                    userName: user ? user.name : 'Unknown',
                    status: 'Paid',
                    method: 'Bank/UPI',
                    date: w.processedDate || w.createdAt
                };
            }),
            ...sellerWithdrawals.map(async (w) => {
                return {
                    id: w._id,
                    type: 'Withdrawal',
                    amount: w.amount,
                    entity: w.sellerId,
                    userName: w.sellerName || 'Seller',
                    status: 'Paid',
                    method: 'Bank/UPI',
                    date: w.processedDate || w.createdAt
                };
            }),
            ...deliveryWithdrawals.map(async (w) => {
                return {
                    id: w._id,
                    type: 'Withdrawal',
                    amount: w.amount,
                    entity: w.agentId,
                    userName: w.agentName || 'Delivery Agent',
                    status: 'Paid',
                    method: 'Bank/UPI',
                    date: w.processedDate || w.createdAt
                };
            })
        ]);

        const history = enrichedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. Get specific user payment history (for modal)
router.get('/user-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const b2cOrders = await SellerOrder.find({ userId });
        const c2bOrders = await C2B_Order.find({ customer_id: userId });
        const withdrawals = await WithdrawalRequest.find({ userId });

        res.status(200).json({
            success: true,
            b2cOrders,
            c2bOrders,
            withdrawals
        });
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 5. Get high-level financial stats
router.get('/stats/financial', async (req, res) => {
    try {
        // Calculate Total Revenue (B2C Orders)
        const b2cStats = await SellerOrder.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = b2cStats[0] ? b2cStats[0].total : 0;

        // Calculate Withdrawals (Approved) - All types
        const [growerW, sellerW, deliveryW] = await Promise.all([
            WithdrawalRequest.aggregate([{ $match: { status: 'Approved' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            SellerWithdrawalRequest.aggregate([{ $match: { status: 'Approved' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            DeliveryWithdrawalRequest.aggregate([{ $match: { status: 'Approved' } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
        ]);

        const totalWithdrawals = (growerW[0]?.total || 0) + (sellerW[0]?.total || 0) + (deliveryW[0]?.total || 0);

        // Calculate Pending Payouts - All types
        const [growerP, sellerP, deliveryP] = await Promise.all([
            WithdrawalRequest.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            SellerWithdrawalRequest.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            DeliveryWithdrawalRequest.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
        ]);

        const pendingPayouts = (growerP[0]?.total || 0) + (sellerP[0]?.total || 0) + (deliveryP[0]?.total || 0);

        res.status(200).json({
            success: true,
            totalRevenue,
            totalWithdrawals,
            pendingPayouts,
            adminProfit: totalRevenue * 0.30
        });
    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 6. Create Razorpay Order for Payout
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        
        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit
            currency,
            receipt,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
});

module.exports = router;
