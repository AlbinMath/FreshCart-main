const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── DB Connections ──────────────────────────────────────────────
// Connect to Customer DB to read proposals & write C2B orders
const customerConn = mongoose.createConnection(process.env.MONGODB_URI_Customer);
customerConn.on('connected', () => console.log('sourcingRoutes: customerConn connected'));
customerConn.on('error', (err) => console.error('sourcingRoutes: customerConn error', err));

// Import usersConn (Users DB) from server for wallet payout
const { usersConn } = require('../server');

// ── Models ──────────────────────────────────────────────────────
const customerProduceProposalSchema = new mongoose.Schema({
    customer_id: String,
    title: String,
    description: String,
    images: [String],
    category: String,
    quantityAvailable: Number,
    quantityUnit: { type: String, default: 'kg' },
    askingPrice: Number,
    harvestDate: Date,
    expirationDate: Date,
    status: String
}, { collection: 'CustomerProduceProposals' });

const CustomerProduceProposal = customerConn.model('CustomerProduceProposal', customerProduceProposalSchema);

const c2bOrderSchemaOptions = require('../../../Shared/OrderIntegrity/models/C2B_OrderSchema');
const C2B_Order = customerConn.model('C2B_Order', c2bOrderSchemaOptions(mongoose));

const Razorpay = require('razorpay');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RL7iTlLIMH8nZY',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rwk1544M3HCWZOAb7E6A2X07',
});

const Seller = require('../models/Seller');

// 1. Fetch available proposals (Filtered by Seller's product categories — flexible keyword match)
router.get('/proposals', async (req, res) => {
    try {
        const { seller_id } = req.query;
        if (!seller_id) return res.status(400).json({ success: false, message: 'seller_id is required' });

        const seller = await Seller.findOne({ _id: seller_id });
        if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

        const categories = seller.productCategories || [];
        const query = { status: 'Pending' };

        if (categories.length > 0) {
            // Flexible keyword match:
            // "Fresh Fruits" → extracts keywords ["Fresh","Fruits"] → matches proposal "Fruits" via regex
            // "Fruits" in proposal → also matches seller "Fresh Fruits" via regex
            // This bridges seller custom names (e.g. "Fresh Fruits") with standard names (e.g. "Fruits")
            const orConditions = [
                { category: { $in: categories } } // exact match first
            ];

            categories.forEach(cat => {
                // Extract meaningful words (4+ chars to skip noise like "and", "the")
                const words = cat.split(/\s+/).filter(w => w.length >= 4);
                words.forEach(word => {
                    orConditions.push({ category: new RegExp(word, 'i') });
                });
            });

            query.$or = orConditions;
        }

        const proposals = await CustomerProduceProposal.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, proposals, sellerCategories: categories });
    } catch (error) {
        console.error('Error fetching sourcing proposals:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



// @route   POST /api/sourcing/proposals/:id/checkout
// @desc    Create a razorpay order for a proposal
// @access  Public (mocking auth)
router.post('/proposals/:id/checkout', async (req, res) => {
    try {
        const { seller_id } = req.body;
        const proposalId = req.params.id;

        if (!seller_id) {
            return res.status(400).json({ success: false, message: 'Seller ID is required' });
        }

        const proposal = await CustomerProduceProposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }

        if (proposal.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Proposal is no longer available' });
        }

        // Create Razorpay Order
        // askingPrice IS the total price (not per-unit) — convert to paise only
        const amount = Math.round(proposal.askingPrice * 100);
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_c2b_${proposalId}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: razorpayOrder,
            proposal: proposal,
            // Fallback for when we're checking out an existing order
            agreedPrice: proposal.askingPrice 
        });

    } catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({ success: false, message: 'Server error during checkout' });
    }
});

// @route   POST /api/sourcing/proposals/:id/claim
// @desc    Initially claim a proposal (commitment) - moves it to Inbound Shipments
router.post('/proposals/:id/claim', async (req, res) => {
    try {
        const { seller_id } = req.body;
        const proposalId = req.params.id;

        if (!seller_id) return res.status(400).json({ success: false, message: 'Seller ID is required' });

        const proposal = await CustomerProduceProposal.findById(proposalId);
        if (!proposal || proposal.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Proposal not available' });
        }

        // Fetch Seller and Customer snapshot details
        const seller = await Seller.findById(seller_id);
        const sellerStoreName = seller?.storeName || 'FreshCart Seller';
        const sellerAddress = seller?.storeAddress || 'Address not listed';
        const sellerPhone = seller?.phoneNumber || '';

        let growerName = 'Local Grower';
        let growerPhone = '';
        try {
            const customerCollection = usersConn.collection('Customer');
            const customer = await customerCollection.findOne({ uid: proposal.customer_id });
            if (customer) {
                growerName = customer.name || customer.username || 'Local Grower';
                growerPhone = customer.phone || customer.phoneNumber || '';
            }
        } catch(err) {
            console.error('Error fetching grower details:', err);
        }

        // Create the C2B Order in 'Pending Payment' state
        const newOrder = new C2B_Order({
            c2bOrderId: 'C2B-' + Date.now().toString().slice(-6),
            proposal_id: proposal._id,
            customer_id: proposal.customer_id,
            seller_id: seller_id,
            agreedPrice: proposal.askingPrice,
            quantity: proposal.quantityAvailable,
            quantityUnit: proposal.quantityUnit,
            proposalTitle: proposal.title || '',
            sellerStoreName,
            sellerAddress,
            sellerPhone,
            growerName,
            growerPhone,
            shippingStatus: 'Pending Drop-off',
            paymentStatus: 'Acquired - Pending Payment',
        });

        await newOrder.save();

        // Update Proposal Status
        proposal.status = 'Accepted';
        await proposal.save();

        res.status(200).json({ success: true, message: 'Produce claimed successfully', order: newOrder });
    } catch (error) {
        console.error('Error claiming produce:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. Fetch all C2B orders for a specific seller (Inbound Shipments tab)
router.get('/orders', async (req, res) => {
    try {
        const { seller_id } = req.query;
        if (!seller_id) return res.status(400).json({ success: false, message: 'seller_id is required' });

        const orders = await C2B_Order.find({ seller_id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching seller C2B orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. Mark C2B Order as received and inspected (Releases payment)
router.put('/orders/:id/receive', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status, paymentMethod, razorpay_payment_id, razorpay_order_id } = req.body; 

        const order = await C2B_Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.shippingStatus = 'Delivered';
        order.inspectionStatus = status;

        if (status === 'Approved') {
            order.paymentStatus = 'Released to Customer';

            if (paymentMethod === 'Online' && razorpay_payment_id) {
                order.razorpayPaymentId = razorpay_payment_id;
                order.razorpayOrderId = razorpay_order_id;
                
                // --- PAYOUT LOGIC (Simulated Wallet Transfer for Online) ---
                try {
                    const customerCollection = usersConn.collection('Customer');
                    await customerCollection.updateOne(
                        { uid: order.customer_id },
                        { $inc: { walletBalance: order.agreedPrice } }
                    );
                    console.log(`Funds of ₹${order.agreedPrice} released to Customer ${order.customer_id}'s wallet (Online).`);
                } catch (err) {
                    console.error(`Error updating Customer wallet:`, err);
                }
            } else {
                // Offline Cash
                order.paymentStatus = 'Offline - Cash Payment';
                console.log(`Offline Cash Payment of ₹${order.agreedPrice} verified for Customer ${order.customer_id}.`);
            }
        } else {
            order.paymentStatus = (paymentMethod === 'Offline' || order.paymentStatus.includes('Offline')) 
                ? 'Cancelled (Offline)' 
                : 'Refunded';
        }

        await order.save();
        res.status(200).json({ success: true, message: `Order marked as ${status}`, order });
    } catch (error) {
        console.error('Error updating C2B order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
