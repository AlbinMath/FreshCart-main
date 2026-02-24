const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DeliveryAgent = require('../models/DeliveryAgent');
const Schedule = require('../models/Schedule');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Review = require('../models/Review');

const router = express.Router();

// Helper for distance calculation (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// --- Nearest Order Logic ---

// Get Nearest Shop Order (Overhauled to use Intelligent Dispatch System Clusters)
router.post('/nearest-shop-order', async (req, res) => {
    try {
        const { latitude, longitude, agentId } = req.body;

        if (!latitude || !longitude || !agentId) {
            return res.status(400).json({ message: 'Location and Agent ID are required' });
        }

        // 1. Fetch the Agent's Assigned Clusters from the IDS API
        const IDS_CORE_API_URL = process.env.IDS_CORE_API_URL || 'http://localhost:2012';
        let idsClusters = [];
        try {
            const clusterRes = await axios.get(`${IDS_CORE_API_URL}/api/agents/${agentId}/assigned-cluster`);
            idsClusters = clusterRes.data || [];
        } catch (idsErr) {
            console.error('[IDS Sync] Failed to fetch agent clusters:', idsErr.message);
        }

        if (!idsClusters || idsClusters.length === 0) {
            return res.json({ message: 'No active orders found in your ML cluster queue' });
        }

        // 2. Extract the sequenced order IDs from the first active cluster
        const targetCluster = idsClusters[0];
        if (!targetCluster.route_sequence || targetCluster.route_sequence.length === 0) {
            return res.json({ message: 'No active orders found in your ML cluster queue' });
        }

        const sequencedOrderStringIds = targetCluster.route_sequence.map(o => o.order_id);

        // 3. Find the first unassigned order in the database that matches the ML sequence
        let nextOrderToAssign = null;
        let sellerInfo = null;

        for (let targetOrderId of sequencedOrderStringIds) {
            const potentialOrder = await Order.findOne({
                orderId: targetOrderId,
                status: 'Shipped', // Only orders ready for pickup
                deliveryAgentId: { $exists: false },
                rejectedAgentIds: { $ne: agentId }
            });

            if (potentialOrder) {
                // Fetch the seller for store info
                const sellerId = potentialOrder.sellerId || (potentialOrder.items && potentialOrder.items.length > 0 && potentialOrder.items[0].sellerId);
                sellerInfo = await Seller.findById(sellerId);

                if (sellerInfo) {
                    // Compute distance (for display purposes in the app)
                    const dist = calculateDistance(latitude, longitude, sellerInfo.latitude || 0, sellerInfo.longitude || 0);
                    nextOrderToAssign = {
                        ...potentialOrder.toObject(),
                        shopName: sellerInfo.storeName || sellerInfo.sellerName,
                        shopAddress: sellerInfo.storeAddress,
                        distance: dist.toFixed(2) // km
                    };
                    break; // Stop at the very first valid order in the route sequence
                }
            }
        }

        if (nextOrderToAssign) {
            res.json(nextOrderToAssign);
        } else {
            // If the entire cluster is assigned/picked up, the ML queue is empty for them
            res.json({ message: 'No active orders found in your ML cluster queue' });
        }

    } catch (err) {
        console.error("Error finding nearest IDS cluster order:", err);
        res.status(500).json({ message: err.message });
    }
});

// Accept Order
router.put('/accept-order', async (req, res) => {
    try {
        const { orderId, agentId } = req.body;

        // Check active order count
        const activeCount = await Order.countDocuments({
            deliveryAgentId: agentId,
            status: 'Out for Delivery'
        });

        if (activeCount >= 5) {
            return res.status(400).json({ message: 'Maximum active order limit (5) reached. Please complete current deliveries.' });
        }

        // Atomically update to ensure no double booking
        const order = await Order.findOneAndUpdate(
            { _id: orderId, deliveryAgentId: { $exists: false } }, // Ensure still unassigned
            {
                status: 'Out for Delivery',
                deliveryAgentId: agentId,
                assignedAt: new Date() // Track assignment time for stats
            },
            { new: true }
        );

        if (!order) {
            return res.status(400).json({ message: 'Order already assigned or not found' });
        }

        // Push status to IDS
        try {
            const IDS_CORE_API_URL = process.env.IDS_CORE_API_URL || 'http://localhost:2012';
            await axios.put(`${IDS_CORE_API_URL}/api/orders/${order.orderId || order._id.toString()}/status`, { status: 'in_transit' });
        } catch (idsErr) {
            console.error('[IDS Sync] Failed to update order status:', idsErr.message);
        }

        res.json({ message: 'Order accepted', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reject Order
router.put('/reject-order', async (req, res) => {
    try {
        const { orderId, agentId } = req.body;

        const order = await Order.findByIdAndUpdate(
            orderId,
            { $addToSet: { rejectedAgentIds: agentId } }, // Add to rejected list
            { new: true }
        );

        res.json({ message: 'Order rejected', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Current Active Delivery for Agent (Multiple)
router.get('/current-delivery/:agentId', async (req, res) => {
    try {
        // Find ALL active orders for this agent
        const orders = await Order.find({
            deliveryAgentId: req.params.agentId,
            status: 'Out for Delivery'
        });

        if (orders && orders.length > 0) {
            const ordersWithDetails = await populateOrderDetails(orders);
            res.json(ordersWithDetails);
        } else {
            res.json([]);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Helper function to populate order details (reused for history)
const populateOrderDetails = async (orders) => {
    return await Promise.all(orders.map(async (order) => {
        try {
            const orderObj = order.toObject();

            // Fetch Shop Details
            let sellerId = order.sellerId;
            if (!sellerId && order.items && order.items.length > 0) {
                sellerId = order.items[0].sellerId;
            }

            if (sellerId) {
                try {
                    const seller = await Seller.findById(sellerId);
                    if (seller) {
                        orderObj.shopName = seller.storeName || seller.sellerName;
                        orderObj.shopAddress = seller.storeAddress;
                        orderObj.shopPhone = seller.phoneNumber;
                    }
                } catch (e) {
                    console.log(`[WARN] Failed to fetch seller ${sellerId}: ${e.message}`);
                }
            }

            // Fetch Customer Details
            if (order.userId) {
                try {
                    const userId = order.userId;
                    let user = null;
                    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

                    // 1. Try User DB (Users collection)
                    if (isValidObjectId(userId)) {
                        try {
                            user = await User.findById(userId);
                        } catch (e) { /* Ignore */ }
                    }

                    // If not found by ID (or ID was invalid for ObjectId), try custom fields in User DB
                    if (!user) {
                        user = await User.findOne({ $or: [{ uid: userId }, { userId: userId }, { firebaseUid: userId }] });
                    }

                    // 2. Try 'Customer' collection in Users DB (Native Driver)
                    if (!user) {
                        try {
                            const customerCol = mongoose.connection.db.collection('Customer');
                            user = await customerCol.findOne({ _id: userId }) ||
                                await customerCol.findOne({ uid: userId }) ||
                                await customerCol.findOne({ userId: userId });

                            if (!user) {
                                const customersCol = mongoose.connection.db.collection('customers');
                                user = await customersCol.findOne({ _id: userId }) || await customersCol.findOne({ uid: userId }) || await customersCol.findOne({ userId: userId });
                            }

                            if (!user) {
                                const lowerCustomerCol = mongoose.connection.db.collection('Users');
                                user = await lowerCustomerCol.findOne({ _id: userId }) || await lowerCustomerCol.findOne({ uid: userId }) || await lowerCustomerCol.findOne({ userId: userId });
                            }

                            if (!user && isValidObjectId(userId)) {
                                const { ObjectId } = require('mongoose').Types;
                                user = await customerCol.findOne({ _id: new ObjectId(userId) });
                            }
                        } catch (e) { /* Ignore */ }
                    }

                    // 3. Try Customer DB (External DB)
                    if (!user) {
                        if (isValidObjectId(userId)) {
                            try {
                                user = await Customer.findById(userId);
                            } catch (e) { /* Ignore */ }
                        }

                        if (!user) {
                            user = await Customer.findOne({ $or: [{ uid: userId }, { userId: userId }, { firebaseUid: userId }] });
                        }
                    }

                    if (user) {
                        if (!orderObj.shippingAddress) orderObj.shippingAddress = {};

                        const name = user.fullName || user.name || user.username || 'N/A';
                        const phone = user.phoneNumber || user.phone || user.contactNumber || user.mobile || 'N/A';
                        const address = user.address || user.residentialAddress || user.shippingAddress;

                        if (!orderObj.shippingAddress.fullName) orderObj.shippingAddress.fullName = name;
                        if (!orderObj.shippingAddress.phoneNumber) orderObj.shippingAddress.phoneNumber = phone;

                        orderObj.customerName = name;
                        orderObj.customerPhone = phone;

                        if (address && (!orderObj.shippingAddress.street && !orderObj.shippingAddress.city)) {
                            orderObj.shippingAddress = { ...orderObj.shippingAddress, ...address };
                        }
                    }
                } catch (e) {
                    console.log(`[WARN] Failed to fetch user data for ${order.userId}: ${e.message}`);
                }
            }

            return orderObj;
        } catch (innerErr) {
            console.error("Error processing order details:", innerErr);
            return order.toObject();
        }
    }));
};

// Get Delivery History (Completed Orders)
router.get('/history/:agentId', async (req, res) => {
    try {
        const orders = await Order.find({
            deliveryAgentId: req.params.agentId,
            status: 'Delivered'
        }).sort({ updatedAt: -1 }); // Newest first

        if (orders && orders.length > 0) {
            const ordersWithDetails = await populateOrderDetails(orders);
            res.json(ordersWithDetails);
        } else {
            res.json([]);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Order Status (General)
router.put('/order-status/:orderId', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status: status },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- OTP Logic ---

// Store Active OTP (Called after generating from Python Service)
router.post('/active-otp', async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        // Temporarily store OTP in the order document
        // In production, encrypt this or use Redis with TTL
        await Order.findByIdAndUpdate(orderId, { deliveryOtp: otp });
        res.json({ message: 'OTP stored' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify OTP and Complete Order
router.post('/verify-otp', async (req, res) => {
    try {
        const { orderId, enteredOtp } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Check Match
        // Convert both to string to be safe
        if (String(order.deliveryOtp) !== String(enteredOtp)) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }

        // Success: Complete Order
        order.status = 'Delivered';
        order.deliveryOtp = null; // Clear OTP

        // Update Payment Status if COD (Cash on Delivery)
        // We update 'paymentStatus' (camelCase) based on DB inspection results.
        if (order.paymentMethod) {
            const method = order.paymentMethod.toLowerCase().trim();

            // Check for common variations of Cash on Delivery
            if (['cash on delivery', 'cod', 'cash'].some(val => method.includes(val))) {
                order.paymentStatus = 'Paid';

                // Fallback for snake_case if schema mixes conventions
                if (order.toObject().payment_status !== undefined) {
                    order.payment_status = 'Paid';
                }
            }
        }

        // Ensure updatedAt is set to now for stats
        order.updatedAt = new Date();

        await order.save();

        // Push status to IDS
        try {
            const IDS_CORE_API_URL = process.env.IDS_CORE_API_URL || 'http://localhost:2012';
            await axios.put(`${IDS_CORE_API_URL}/api/orders/${order.orderId || order._id.toString()}/status`, { status: 'delivered' });
        } catch (idsErr) {
            console.error('[IDS Sync] Failed to update order status to delivered:', idsErr.message);
        }

        res.json({ message: 'Order completed successfully', order });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- Scheduling Routes ---

// Get Schedule for an Agent
router.get('/schedule/:agentId', async (req, res) => {
    try {
        const agentId = req.params.agentId.trim();
        // console.log('GET /schedule/:agentId called with:', agentId);
        const schedules = await Schedule.find({ agentId });
        res.json(schedules);
    } catch (err) {
        console.error('Error in GET /schedule:', err);
        res.status(500).json({ message: err.message });
    }
});

// Save/Update Schedule
router.post('/schedule', async (req, res) => {
    const { agentId, date, slots } = req.body;
    try {
        // Upsert: Update if exists, otherwise create
        const schedule = await Schedule.findOneAndUpdate(
            { agentId, date },
            { slots },
            { new: true, upsert: true }
        );
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find agent by email
        const agent = await DeliveryAgent.findOne({ email });
        if (!agent) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, agent.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign(
            { id: agent._id, email: agent.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            agent: {
                id: agent._id,
                fullName: agent.fullName,
                email: agent.email,
                status: agent.status,
                contactNumber: agent.contactNumber,
                dateOfBirth: agent.dateOfBirth,
                residentialAddress: agent.residentialAddress,
                pinCode: agent.pinCode,
                vehicleRegistrationNumber: agent.vehicleRegistrationNumber,
                bankAccountNumber: agent.bankAccountNumber,
                ifscCode: agent.ifscCode,
                upiId: agent.upiId,
                accountHolderName: agent.accountHolderName
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/check-user', async (req, res) => {
    try {
        const { contactNumber } = req.body;
        const agent = await DeliveryAgent.findOne({ contactNumber });

        if (!agent) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User found' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Status (Online/Offline)
router.put('/status/:agentId', async (req, res) => {
    try {
        const { isOnline } = req.body;
        const agent = await DeliveryAgent.findByIdAndUpdate(
            req.params.agentId,
            { isOnline },
            { new: true }
        );
        res.json(agent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    // ...
    try {
        const { contactNumber, newPassword } = req.body;

        const agent = await DeliveryAgent.findOne({ contactNumber });
        if (!agent) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        agent.passwordHash = await bcrypt.hash(newPassword, salt);
        await agent.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Sellers for Map
router.get('/sellers', async (req, res) => {
    try {
        const sellers = await Seller.find({}, 'storeName storeAddress latitude longitude phoneNumber');
        res.json(sellers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Settings & Profile ---

// Get Agent Profile
router.get('/profile/:agentId', async (req, res) => {
    try {
        const agent = await DeliveryAgent.findById(req.params.agentId).select('-passwordHash');
        if (!agent) return res.status(404).json({ message: 'Agent not found' });
        res.json(agent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate Unique ID
router.post('/generate-id/:agentId', async (req, res) => {
    try {
        const agent = await DeliveryAgent.findById(req.params.agentId);
        if (!agent) return res.status(404).json({ message: 'Agent not found' });

        if (agent.uniqueId) {
            return res.status(400).json({ message: 'Unique ID already exists', uniqueId: agent.uniqueId });
        }

        // Generate FC-DEL-XXXXXX
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newId = `FC-DEL-${randomStr}`;

        agent.uniqueId = newId;
        await agent.save();

        res.json({ message: 'Unique ID generated', uniqueId: newId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Today's Stats
router.get('/stats/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // 1. Order Stats
        const assignedCount = await Order.countDocuments({
            deliveryAgentId: agentId,
            assignedAt: { $gte: startOfDay }
        });

        const completedCount = await Order.countDocuments({
            deliveryAgentId: agentId,
            status: 'Delivered',
            updatedAt: { $gte: startOfDay }
        });

        // 2. Rating Stats (Across all time for the agent)
        // Find all orders assigned to this agent
        const agentOrders = await Order.find({ deliveryAgentId: agentId }, '_id');
        const orderIds = agentOrders.map(o => o._id.toString());

        // Find reviews for these orders
        const reviews = await Review.find({ orderId: { $in: orderIds } });

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.deliveryRate || 0), 0) / reviews.length).toFixed(1)
            : "0.0";

        res.json({
            assigned: assignedCount,
            completed: completedCount,
            averageRating: avgRating,
            totalReviews: reviews.length
        });
    } catch (err) {
        console.error("Error fetching agent stats:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get Delivery Reviews for an Agent
router.get('/reviews/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agentOrders = await Order.find({ deliveryAgentId: agentId }, '_id');
        const orderIds = agentOrders.map(o => o._id.toString());

        const reviews = await Review.find({
            orderId: { $in: orderIds },
            $or: [
                { deliveryReview: { $exists: true, $ne: "" } },
                { deliveryRate: { $exists: true } }
            ]
        }).sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        console.error("Error fetching agent reviews:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get Product Details
router.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server error fetching product' });
    }
});

module.exports = router;
