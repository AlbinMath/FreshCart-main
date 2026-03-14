const express = require('express');
const router = express.Router();
const { customerConn, productsConn } = require('../config/db');
const mongoose = require('mongoose');

// Define Models for existing schemas
const c2bOrderSchemaOptions = require('../../../Shared/OrderIntegrity/models/C2B_OrderSchema');
const C2B_Order = customerConn.models.C2B_Order || customerConn.model('C2B_Order', c2bOrderSchemaOptions(mongoose));

const withdrawalRequestSchema = require('../../../Customer/Backend/models/WithdrawalRequest');
const WithdrawalRequest = customerConn.models.WithdrawalRequest || customerConn.model('WithdrawalRequest', withdrawalRequestSchema);

// User models from default connection
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const DeliveryAgent = require('../models/DeliveryAgent');

const sellerOrderSchema = new mongoose.Schema({
    totalAmount: Number,
    paymentStatus: String,
    status: String,
    createdAt: Date
}, { collection: 'Orders' });
const SellerOrder = productsConn.models.Orders || productsConn.model('Orders', sellerOrderSchema);

// GET /api/reports/stats
router.get('/stats', async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        const now = new Date();
        
        let startDate, comparisonStartDate, comparisonEndDate;

        if (range === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
            comparisonStartDate = new Date(now.getFullYear() - 1, 0, 1);
            comparisonEndDate = new Date(now.getFullYear() - 1, 11, 31);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
            comparisonStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            comparisonEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of last month
        }

        // 1. Revenue Metrics (Total Revenue for current period)
        const currentPeriodRevenue = await SellerOrder.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const comparisonPeriodRevenue = await SellerOrder.aggregate([
            { $match: { createdAt: { $gte: comparisonStartDate, $lte: comparisonEndDate } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const currentRev = currentPeriodRevenue[0]?.total || 0;
        const prevRev = comparisonPeriodRevenue[0]?.total || 0;
        const revenueGrowth = prevRev === 0 ? 100 : ((currentRev - prevRev) / prevRev) * 100;

        // 2. User Metrics (All time)
        const totalCustomers = await Customer.countDocuments({ role: 'customer' });
        const totalSellers = await Seller.countDocuments({});
        const totalDelivery = await DeliveryAgent.countDocuments({});

        // 3. Platform Growth (New Users this period)
        const newUsers = await Customer.countDocuments({ 
            createdAt: { $gte: startDate },
            role: 'customer'
        });

        // 4. Payout Metrics (All time)
        const payouts = await WithdrawalRequest.aggregate([
            { $group: {
                _id: "$status",
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }}
        ]);

        const approvedPayouts = payouts.find(p => p._id === 'Approved')?.total || 0;
        const pendingPayouts = payouts.find(p => p._id === 'Pending')?.total || 0;

        // 5. Monthly Revenue Trend (Always last 6 months for chart)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyTrend = await SellerOrder.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { 
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }
                },
                revenue: { $sum: "$totalAmount" }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.status(200).json({
            success: true,
            summary: {
                totalRevenue: currentRev,
                revenueGrowth: revenueGrowth.toFixed(1),
                totalCustomers,
                newUsers,
                totalSellers,
                totalDelivery,
                approvedPayouts,
                pendingPayouts,
                platformProfit: currentRev * 0.30
            },
            trends: {
                monthlyRevenue: monthlyTrend.map(t => ({
                    name: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short' }),
                    revenue: t.revenue,
                    profit: t.revenue * 0.30
                }))
            }
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
