const express = require('express');
const router = express.Router();
const CustomerPlan = require('../models/CustomerPlan');
const AdminPremiumPlan = require('../models/PremiumPlan');
const axios = require('axios');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Keep TAX_SERVICE_URL as it is since Tax is a separate service
const TAX_SERVICE_URL = process.env.TAX_SERVICE_URL || 'http://localhost:5005';

// @route   GET /api/public/premium-plans
// @desc    Get all active premium plans for customers
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Query the admin MongoDB directly
        const customerPlans = await AdminPremiumPlan.find({
            type: 'customer',
            isVisible: true
        });

        if (customerPlans && customerPlans.length > 0) {
            res.json(customerPlans);
        } else {
            res.status(404).json({ msg: 'No plans found' });
        }
    } catch (err) {
        console.error('Error fetching plans from Admin DB:', err.message);
        res.status(500).send('Server Error fetching plans');
    }
});

// @route   POST /api/public/premium-plans/create-razorpay-order
// @desc    Create a Razorpay order for premium plan purchase
// @access  Public
router.post('/create-razorpay-order', async (req, res) => {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
        return res.status(400).json({ msg: 'Please provide userId and planId' });
    }

    try {
        const plan = await AdminPremiumPlan.findOne({ _id: planId, type: 'customer' });
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        let price = 0;
        if (plan.price.toLowerCase() !== 'free') {
            const match = plan.price.match(/\d+/);
            if (match) price = parseInt(match[0], 10);
        }

        if (price === 0) {
            return res.status(400).json({ msg: 'This plan is free, no payment needed' });
        }

        // Calculate Tax First
        let grandTotal = price;
        try {
            const taxPayload = {
                items: [{ id: plan._id.toString(), name: plan.name, price: price, category: 'premium', quantity: 1 }],
                deliveryFee: 0, platformFee: 0
            };
            const taxRes = await axios.post(`${TAX_SERVICE_URL}/api/v1/tax/calculate`, taxPayload);
            if (taxRes.data && taxRes.data.success) {
                grandTotal = taxRes.data.data.totals.grandTotal;
            }
        } catch (taxError) {
            console.error('Error fetching tax, falling back to 0 tax:', taxError.message);
        }

        const options = {
            amount: Math.round(grandTotal * 100), // Amount in paise
            currency: "INR",
            receipt: "plan_rcptid_" + Date.now()
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID,
            totalAmount: grandTotal // also send backend calculated total
        });
    } catch (error) {
        console.error("Error creating plan order:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

// @route   POST /api/public/premium-plans/verify-payment
// @desc    Verify Razorpay payment and create CustomerPlan
// @access  Public
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            planId,
            taxAmount,
            grandTotal,
            durationDays
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const plan = await AdminPremiumPlan.findOne({ _id: planId, type: 'customer' });
            if (!plan) {
                return res.status(404).json({ success: false, msg: 'Plan not found during verification' });
            }

            let price = 0;
            if (plan.price.toLowerCase() !== 'free') {
                const match = plan.price.match(/\d+/);
                if (match) price = parseInt(match[0], 10);
            }

            const activationDate = new Date();
            const expiryDate = new Date(activationDate);
            expiryDate.setDate(expiryDate.getDate() + durationDays);

            const newCustomerPlan = new CustomerPlan({
                userId,
                planId: plan._id.toString(),
                planName: plan.name,
                price,
                durationDays,
                taxAmount,
                grandTotal,
                activationDate,
                expiryDate,
                status: 'active'
            });

            const savedPlan = await newCustomerPlan.save();
            res.json({ success: true, message: "Payment verified and plan activated", purchaseDetails: savedPlan });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (err) {
        console.error("Error verifying payment:", err);
        res.status(500).json({ success: false, message: "Verification failed" });
    }
});

// @route   POST /api/public/premium-plans/purchase-free
// @desc    Purchase a premium plan
// @access  Public
router.post('/purchase-free', async (req, res) => {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
        return res.status(400).json({ msg: 'Please provide userId and planId' });
    }

    try {
        // 1. Fetch Plan Details from Admin DB directly
        const plan = await AdminPremiumPlan.findOne({
            _id: planId,
            type: 'customer'
        });

        if (!plan) {
            return res.status(404).json({ msg: 'Plan not found or not available for customers' });
        }

        // 2. Parse price and duration (basic handling)
        let price = 0;
        if (plan.price.toLowerCase() !== 'free') {
            // Extract numbers from something like "₹499"
            const match = plan.price.match(/\d+/);
            if (match) {
                price = parseInt(match[0], 10);
            }
        }

        let durationDays = 30; // Default 1 month
        const durationStr = plan.duration.toLowerCase();
        if (durationStr.includes('month')) {
            const match = plan.duration.match(/\d+/);
            durationDays = match ? parseInt(match[0], 10) * 30 : 30;
        } else if (durationStr.includes('lifetime')) {
            durationDays = 36500; // 100 years approx
        } else if (durationStr.includes('year')) {
            const match = plan.duration.match(/\d+/);
            durationDays = match ? parseInt(match[0], 10) * 365 : 365;
        }

        // 3. Calculate Tax using Tax Service
        let taxAmount = 0;
        let grandTotal = price;
        let taxBreakdown = null;

        if (price > 0) {
            try {
                // Simulate an item payload for tax calculation
                const taxPayload = {
                    items: [{
                        id: plan._id.toString(),
                        name: plan.name,
                        price: price,
                        category: 'premium',
                        quantity: 1
                    }],
                    deliveryFee: 0,
                    platformFee: 0
                };

                const taxRes = await axios.post(`${TAX_SERVICE_URL}/api/v1/tax/calculate`, taxPayload);
                if (taxRes.data && taxRes.data.success) {
                    taxAmount = taxRes.data.data.totals.totalTax;
                    grandTotal = taxRes.data.data.totals.grandTotal;
                    taxBreakdown = taxRes.data.data.breakdown;
                }
            } catch (taxError) {
                console.error('Error fetching tax, falling back to 0 tax:', taxError.message);
                // Fallback to 0 tax if service is unreachable
            }
        }

        // 4. Calculate Expiry Date
        const activationDate = new Date();
        const expiryDate = new Date(activationDate);
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        // 5. Create CustomerPlan Record
        const newCustomerPlan = new CustomerPlan({
            userId,
            planId: plan._id.toString(),
            planName: plan.name,
            price,
            durationDays,
            taxAmount,
            grandTotal,
            activationDate,
            expiryDate,
            status: 'active'
        });

        const savedPlan = await newCustomerPlan.save();

        res.json({
            msg: 'Plan purchased successfully',
            purchaseDetails: savedPlan,
            taxBreakdown: taxBreakdown
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during purchase');
    }
});

// @route   GET /api/public/premium-plans/my-plans/:userId
// @desc    Get all plans for a specific user and auto-expire them if needed
// @access  Public
router.get('/my-plans/:userId', async (req, res) => {
    try {
        const plans = await CustomerPlan.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        const now = new Date();

        // Auto-expiry check
        const processedPlans = await Promise.all(plans.map(async (plan) => {
            if (plan.status === 'active' && plan.expiryDate && new Date(plan.expiryDate) < now) {
                plan.status = 'expired';
                await plan.save();
            }
            return plan;
        }));

        res.json(processedPlans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error fetching user plans');
    }
});

module.exports = router;
