const express = require('express');
const router = express.Router();
const PremiumPlan = require('../models/PremiumPlan');

// @route   GET /api/premium-plans
// @desc    Get all premium plans
// @access  Public (or Protected based on needs)
router.get('/', async (req, res) => {
    try {
        const plans = await PremiumPlan.find();
        res.json(plans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/premium-plans
// @desc    Create a premium plan
// @access  Private (Admin)
router.post('/', async (req, res) => {
    try {
        const newPlan = new PremiumPlan(req.body);
        const plan = await newPlan.save();
        res.json(plan);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/premium-plans/:id
// @desc    Update a premium plan
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
    try {
        let plan = await PremiumPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        plan = await PremiumPlan.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(plan);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/premium-plans/:id/visibility
// @desc    Toggle plan visibility
// @access  Private (Admin)
router.patch('/:id/visibility', async (req, res) => {
    try {
        let plan = await PremiumPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        plan.isVisible = !plan.isVisible;
        await plan.save();
        res.json(plan);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/premium-plans/:id
// @desc    Delete a premium plan
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        let plan = await PremiumPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        await PremiumPlan.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Plan removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/premium-plans/seed
// @desc    Seed initial plans
// @access  Private (Dev/Admin)
router.post('/seed', async (req, res) => {
    try {
        // Clear existing
        await PremiumPlan.deleteMany({});

        const seedData = [
            // Seller Plans
            { type: 'seller', name: 'Standard', price: 'Free', duration: 'Lifetime', description: 'Basic fractures for all sellers.', features: ['Standard Delivery', 'Order Tracking', 'Basic Support', 'Basic Offers Only'], color: 'gray', icon: 'Truck', recommended: false, isVisible: true },
            { type: 'seller', name: 'Lite', price: '₹99', duration: '1 Month', description: 'Starter pack. First time user: ₹29 only.', features: ['Priority Delivery', 'Order Tracking', 'Chat Support System', 'Delivery Analysis', 'Order Helping', 'Free Delivery on orders > ₹500', 'Exclusive Member Deals', 'Early Access to Sale', 'Members Only Coupon'], color: 'blue', icon: 'Zap', recommended: false, isVisible: true },
            { type: 'seller', name: 'Plus', price: '₹199', duration: '3 Months', description: 'Grow your business faster.', features: ['Priority Delivery', 'Order Tracking', 'Chat Support System', 'Delivery Analysis', 'Order Helping', 'Free Delivery on orders > ₹500', 'Exclusive Member Deals', 'Early Access to Sale', 'Members Only Coupon'], color: 'green', icon: 'Star', recommended: true, isVisible: true },
            { type: 'seller', name: 'Premium', price: '₹299', duration: '6 Months', description: 'Established sellers choice.', features: ['Free Delivery', 'Fast Delivery', 'Instant Refunds', 'Order Tracking', 'VIP Support Line', 'Delivery Analysis', 'Order Helping', 'Exclusive Offers', 'Members Only Coupon', 'Birthday Special Rewards'], color: 'purple', icon: 'Shield', recommended: false, isVisible: true },
            { type: 'seller', name: 'Elite', price: '₹399', duration: '12 Months', description: 'Maximum power for your business.', features: ['Free Delivery', 'Fast Delivery', 'Instant Refunds', 'Order Tracking', 'VIP Support Line', 'Delivery Analysis', 'Order Helping', 'Exclusive Offers', 'Members Only Coupon', 'Birthday Special Rewards'], color: 'orange', icon: 'Clock', recommended: false, isVisible: true },

            // Customer Plans
            { type: 'customer', name: 'Standard', price: 'Free', duration: 'Lifetime', description: 'Basic options.', features: ['Standard Delivery', 'Order Tracking', 'Basic Support', 'Basic Offer Only'], color: 'gray', icon: 'ShoppingBag', recommended: false, isVisible: true },
            { type: 'customer', name: 'Lite', price: '₹99', duration: '1 Month', description: 'Experience better delivery. ₹29 for first time users.', features: ['Priority Delivery', 'Free Delivery on orders > ₹500', 'Order Tracking', 'Chat Support', 'Exclusive Member Deals', 'Early Access to Sales', 'Members Only Coupons', 'Delivery Analysis'], color: 'blue', icon: 'Zap', recommended: false, isVisible: true },
            { type: 'customer', name: 'Plus', price: '₹199', duration: '3 Months', description: 'More value for regular shoppers.', features: ['Priority Delivery', 'Free Delivery on orders > ₹500', 'Order Tracking', 'Chat Support', 'Exclusive Member Deals', 'Early Access to Sales', 'Members Only Coupons', 'Delivery Analysis'], color: 'green', icon: 'Star', recommended: true, isVisible: true },
            { type: 'customer', name: 'Premium', price: '₹299', duration: '6 Months', description: 'Premium perks for frequent shoppers.', features: ['Free Delivery', 'Fast Delivery', 'Instant Refunds', 'Order Tracking', 'VIP Support Line', 'Delivery Analysis', 'Exclusive Offers', 'Members Only Coupons', 'Birthday Special Rewards'], color: 'purple', icon: 'Heart', recommended: false, isVisible: true },
            { type: 'customer', name: 'Elite', price: '₹399', duration: '12 Months', description: 'The ultimate shopping experience.', features: ['Free Delivery', 'Fast Delivery', 'Instant Refunds', 'Order Tracking', 'VIP Support Line', 'Delivery Analysis', 'Exclusive Offers', 'Members Only Coupons', 'Birthday Special Rewards'], color: 'orange', icon: 'Shield', recommended: false, isVisible: true }
        ];

        await PremiumPlan.insertMany(seedData);
        res.json({ msg: 'Plans seeded successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

module.exports = router;
