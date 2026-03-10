const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const DeliveryAgent = require('../models/DeliveryAgent');
const Schedule = require('../models/Schedule');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Review = require('../models/Review');
const IDSCluster = require('../models/IDSCluster');

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

        // 2. Extract the cluster to offer the agent
        const targetCluster = idsClusters[0];
        if (!targetCluster.route_sequence || targetCluster.route_sequence.length === 0) {
            return res.json({ message: 'No active orders found in your ML cluster queue' });
        }

        // Ensure these orders are still pending/unassigned in DB to be absolutely safe
        const sequencedOrderStringIds = targetCluster.route_sequence.map(o => o.order_id);
        const validOrders = await Order.find({
            orderId: { $in: sequencedOrderStringIds },
            status: { $in: ['Shipped', 'Ready for Shipping', 'Dispatched'] },
            deliveryAgentId: { $exists: false }
        });

        if (validOrders.length === 0) {
            return res.json({ message: 'No active valid orders found in your ML cluster queue' });
        }

        // Distances can be calculated to centroid if available, or just say Optimized
        res.json({
            isCluster: true,
            clusterId: targetCluster.cluster_id,
            _id: targetCluster.cluster_id, // For UI compatibility
            shopName: `Smart Route (${validOrders.length} Drops)`,
            shopAddress: 'Multiple Locations',
            distance: 'Optimized',
            items: validOrders,
            orderCount: validOrders.length
        });

    } catch (err) {
        console.error("Error finding nearest IDS cluster order:", err);
        res.status(500).json({ message: err.message });
    }
});

// Accept Order
router.put('/accept-order', async (req, res) => {
    try {
        const { orderId, agentId } = req.body;

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

// Accept Cluster
router.put('/accept-cluster', async (req, res) => {
    try {
        const { clusterId, agentId } = req.body;

        const IDS_CORE_API_URL = process.env.IDS_CORE_API_URL || 'http://localhost:2012';

        // 1. Get the cluster from IDS
        const clusterRes = await axios.get(`${IDS_CORE_API_URL}/api/agents/${agentId}/assigned-cluster`);
        const clusters = clusterRes.data || [];
        const targetCluster = clusters.find(c => c.cluster_id === clusterId);

        if (!targetCluster) {
            return res.status(404).json({ message: 'Cluster not found or not assigned to you' });
        }

        const sequencedOrderStringIds = targetCluster.route_sequence;

        // Convert the string IDs to ObjectIds because they are matched against `_id` in the Products DB.
        const mongoose = require('mongoose');
        const sequencedObjectIds = sequencedOrderStringIds.map(id => new mongoose.Types.ObjectId(id));

        // 2. Fetch the orders locally
        const validOrders = await Order.find({
            $or: [
                { _id: { $in: sequencedObjectIds } },
                { orderId: { $in: sequencedOrderStringIds } }
            ],
            deliveryAgentId: { $exists: false }
        });

        if (validOrders.length === 0) {
            return res.status(400).json({ message: 'No valid unassigned orders found in this cluster.' });
        }

        const validOrderIds = validOrders.map(o => o._id);
        const validOrderStringIds = validOrders.map(o => o.orderId).filter(id => id);

        // 3. Atomically assign all found orders
        await Order.updateMany(
            { $or: [{ _id: { $in: validOrderIds } }, { orderId: { $in: validOrderStringIds } }] },
            {
                $set: {
                    status: 'Out for Delivery',
                    deliveryAgentId: agentId,
                    assignedAt: new Date()
                }
            }
        );

        // 4. Update order statuses in IDS
        for (let order of validOrders) {
            try {
                await axios.put(`${IDS_CORE_API_URL}/api/orders/${order.orderId}/status`, { status: 'in_transit' });
            } catch (e) {
                console.error('[IDS Sync] Error updating order status for', order.orderId);
            }
        }

        // Update cluster status to indicate it's been active/accepted is generally good practice
        // but not strictly required unless Python engine tracks "accepted" vs "assigned"

        res.json({ message: `Successfully accepted cluster with ${validOrders.length} orders` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reject Cluster
router.put('/reject-cluster', async (req, res) => {
    try {
        const { clusterId, agentId } = req.body;

        const IDS_CORE_API_URL = process.env.IDS_CORE_API_URL || 'http://localhost:2012';

        // 1. Reset cluster on IDS so it can be re-assigned
        try {
            await axios.put(`${IDS_CORE_API_URL}/api/dispatch/cluster/${clusterId}/status`, { status: 'rejected' });
        } catch (e) {
            console.error('[IDS Sync] Error rejecting cluster:', e.message);
        }

        // Technically we might want to also flag the orders so they aren't assigned to this agent again
        // But the rejection at the cluster level is usually sufficient as the Engine re-evaluates

        res.json({ message: 'Cluster rejected successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Current Active Delivery for Agent (Multiple, Ordered by Cluster Route Sequence)
router.get('/current-delivery/:agentId', async (req, res) => {
    try {
        const agentId = req.params.agentId;

        // 1. Find ALL active orders for this agent in the main DB
        const orders = await Order.find({
            deliveryAgentId: agentId,
            status: { $in: ['Out for Delivery', 'in_transit'] }
        });

        if (!orders || orders.length === 0) {
            return res.json([]);
        }

        // 2. Fetch the agent's active cluster from IDS DB 
        // using the assigned_agent_id field.
        const activeCluster = await IDSCluster.findOne({
            assigned_agent_id: agentId,
            status: { $in: ['assigned', 'in_transit', 'active'] }
        });

        // 3. Populate order details using the existing helper
        let ordersWithDetails = await populateOrderDetails(orders);

        // 4. If we have a cluster with a route sequence, apply ordering and 'next' logic
        if (activeCluster && activeCluster.route_sequence && activeCluster.route_sequence.length > 0) {
            const sequenceIds = activeCluster.route_sequence;

            // Reorder the local orders based on the route sequence
            ordersWithDetails.sort((a, b) => {
                const indexA = sequenceIds.indexOf(a.orderId || a._id.toString());
                const indexB = sequenceIds.indexOf(b.orderId || b._id.toString());

                // If an order isn't in sequence (fallback), push it to the end
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;

                return indexA - indexB;
            });

            // Mark the very first order as 'next in sequence' allowing its completion
            if (ordersWithDetails.length > 0) {
                // Since they are ordered, index 0 is the next one to deliver
                ordersWithDetails[0].isNextInSequence = true;

                // All others are false
                for (let i = 1; i < ordersWithDetails.length; i++) {
                    ordersWithDetails[i].isNextInSequence = false;
                }
            }
        } else {
            // Fallback if no cluster is found, all are marked as 'next' 
            // so frontend continues to work without sequence enforcement
            ordersWithDetails.forEach(o => o.isNextInSequence = true);
        }

        res.json(ordersWithDetails);
    } catch (err) {
        console.error("Error in /current-delivery/:agentId :", err);
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
        // We update 'paymentStatus' and 'payment_status' to ensure compatibility with different schemas.
        if (order.paymentMethod) {
            const method = order.paymentMethod.toLowerCase().trim();

            // Check for common variations of Cash on Delivery
            if (['cash on delivery', 'cod', 'cash'].some(val => method.includes(val))) {
                order.paymentStatus = 'Paid';

                // Mongoose strict: false allows this, but we explicitly set it using set() 
                // to ensure MongoDB receives both casing styles if needed by other microservices.
                order.set('payment_status', 'Paid');
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

        // --- Cluster Progress Check ---
        try {
            const agentId = order.deliveryAgentId;
            if (agentId) {
                const activeCluster = await IDSCluster.findOne({
                    assigned_agent_id: agentId,
                    status: { $in: ['assigned', 'in_transit', 'active'] }
                });

                if (activeCluster && activeCluster.route_sequence) {
                    const clusterOrderIds = activeCluster.route_sequence;

                    // Check how many orders in this cluster are STILL NOT Delivered
                    const pendingOrdersInCluster = await Order.countDocuments({
                        $or: [{ orderId: { $in: clusterOrderIds } }, { _id: { $in: clusterOrderIds } }],
                        status: { $ne: 'Delivered' }
                    });

                    // If zero, the entire clustered route is finished
                    if (pendingOrdersInCluster === 0) {
                        activeCluster.status = 'completed';
                        activeCluster.updatedAt = new Date();
                        await activeCluster.save();
                        console.log(`[Cluster] Cluster ${activeCluster.cluster_id} marked as completed for agent ${agentId}`);
                    }
                }
            }
        } catch (clusterErr) {
            console.error('Error updating cluster progress:', clusterErr);
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
