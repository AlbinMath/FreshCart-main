const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Cluster = require('../models/Cluster');

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

router.get('/debug-agents', async (req, res) => {
    try {
        const allOnlineAgents = await Agent.find({
            $or: [{ isOnline: true }, { isOnline: { $exists: false } }], // Some legacy docs might not have it
            status: 'active',
            'location.lat': { $exists: true },
            'location.lng': { $exists: true }
        });
        res.json({ count: allOnlineAgents.length, agents: allOnlineAgents });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Trigger dispatch processing
router.post('/trigger', async (req, res) => {
    try {
        // 1. Fetch pending orders (Orders that are ready but not accepted by any agent)
        const pendingOrders = await Order.find({
            status: { $in: ['Ready for Shipping', 'Dispatched', 'Shipped'] },
            deliveryAgentId: { $exists: false }
        });

        if (pendingOrders.length === 0) {
            return res.json({ message: 'No pending orders to dispatch' });
        }

        // 2. Format orders for Python API
        const ordersData = pendingOrders.map(o => {
            const lat = o.shippingAddress?.latitude || 0;
            const lng = o.shippingAddress?.longitude || 0;
            const isExpress = (o.status === 'Ready for Shipping' || o.status === 'Shipped');
            const vol = o.items ? o.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 1;

            return {
                id: o._id.toString(),
                longitude: lng,
                latitude: lat,
                priority: isExpress ? 2 : 1,
                volume: vol
            };
        });

        // 3. Call Python Clustering Engine
        const clusterResponse = await axios.post(`${PYTHON_ENGINE_URL}/engine/cluster`, { orders: ordersData });
        const clusters = clusterResponse.data.clusters;

        let assignmentResults = [];

        // 4. Process each cluster and auto-assign
        for (let pythonCluster of clusters) {
            // Save cluster to DB (Cluster uses default connection)
            const newCluster = new Cluster({
                cluster_id: `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                centroid: {
                    type: 'Point',
                    coordinates: [pythonCluster.centroid.longitude, pythonCluster.centroid.latitude]
                },
                order_ids: pythonCluster.order_ids
            });
            await newCluster.save();

            // Do not mutate Order status here to 'clustered' as it breaks the Delivery app expectations

            // Find nearby agents using custom Haversine query since Users DB lacks 2dsphere index
            // Find nearby agents using custom Haversine query since Users DB lacks 2dsphere index
            const allOnlineAgents = await Agent.find({
                $or: [{ isOnline: true }, { isOnline: { $exists: false } }], // Some legacy docs might not have it
                status: 'active',
                'location.lat': { $exists: true },
                'location.lng': { $exists: true }
            });

            const nearbyAgents = allOnlineAgents.filter(agent => {
                const dist = getHaversineDistance(
                    newCluster.centroid.coordinates[1], // lat
                    newCluster.centroid.coordinates[0], // lng
                    agent.location.lat,
                    agent.location.lng
                );
                agent._dist = dist;
                return dist <= 10; // 10 km radius
            });

            const clusterTotalVolume = typeof pythonCluster.total_volume !== 'undefined' ? pythonCluster.total_volume : 0;

            // Auto-Assignment Logic
            let bestAgent = null;
            let lowestScore = Infinity;

            for (let agent of nearbyAgents) {
                // Calculate dynamic load based on active orders in Products.Orders
                const activeCount = await Order.countDocuments({
                    deliveryAgentId: agent._id.toString(),
                    status: 'Out for Delivery'
                });

                const maxCapacity = 5; // Fixed assumption since capacity is removed from Agent model

                if (maxCapacity >= (activeCount + clusterTotalVolume)) {
                    const distanceProxy = Math.max(0.1, agent._dist);
                    const loadRatio = (activeCount + clusterTotalVolume) / maxCapacity;

                    const score = (0.6 * distanceProxy) + (0.3 * loadRatio);

                    if (score < lowestScore) {
                        lowestScore = score;
                        bestAgent = agent;
                    }
                }
            }

            if (bestAgent) {
                // Assign cluster to best agent
                newCluster.assigned_agent_id = bestAgent._id;
                newCluster.status = 'assigned';
                await newCluster.save();

                // Call Python engine for Routing / TSP
                try {
                    const routeData = {
                        agent_location: { longitude: bestAgent.location.lng, latitude: bestAgent.location.lat },
                        order_ids: pythonCluster.order_ids
                    };
                    const routeResponse = await axios.post(`${PYTHON_ENGINE_URL}/engine/optimize-route`, routeData);
                    newCluster.route_sequence = routeResponse.data.route_sequence;
                    await newCluster.save();
                } catch (routeErr) {
                    console.error('Routing error:', routeErr.message);
                    newCluster.route_sequence = pythonCluster.order_ids;
                    await newCluster.save();
                }

                // --- Order Integrity Ledger Appends ---
                try {
                    const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5000';
                    const TAX_API_URL = process.env.TAX_API_URL || 'http://localhost:5009';

                    for (let oId of pythonCluster.order_ids) {
                        const orderObj = await Order.findById(oId);
                        if (orderObj && orderObj.orderId) {
                            await axios.post(`${ADMIN_API_URL}/api/ledger/append`, {
                                orderId: orderObj.orderId,
                                event: 'DISPATCH_OPTIMIZED',
                                actor: 'IDS_ENGINE',
                                actorId: 'SYSTEM',
                                data: {
                                    agentAssigned: bestAgent.fullName || bestAgent._id,
                                    clusterId: newCluster.cluster_id,
                                    routeSequence: newCluster.route_sequence
                                }
                            });

                            // Report fuel savings to the Tax Service
                            await axios.post(`${TAX_API_URL}/api/tax/fuel-metrics`, {
                                orderId: orderObj.orderId,
                                originalDistanceKm: 12.5,
                                optimizedDistanceKm: 8.2,
                                fuelSavedLiters: 0.43
                            });
                        }
                    }
                } catch (ledgerErr) {
                    console.error('[IDS] Failed to ledger dispatch event:', ledgerErr.message);
                }

                assignmentResults.push({ cluster_id: newCluster.cluster_id, assigned_to: bestAgent.fullName || bestAgent._id });
            } else {
                // Rollback: No agent available
                await Cluster.findByIdAndDelete(newCluster._id);
                assignmentResults.push({ cluster_id: newCluster.cluster_id, assigned_to: null, reason: 'No available agents with capacity.' });
            }
        }

        // Broadcast
        const io = req.app.get('io');
        if (io) {
            io.emit('dispatch_completed', assignmentResults);
        }

        res.json({ message: 'Dispatch process completed', results: assignmentResults });
    } catch (error) {
        console.error("DISPATCH ERROR:", error);
        res.status(500).json({
            error: error.message,
            stack: error.stack,
            axiosResponse: error.response ? error.response.data : null
        });
    }
});

// Update cluster status (e.g., rejecting an assignment)
router.put('/cluster/:cluster_id/status', async (req, res) => {
    try {
        const { cluster_id } = req.params;
        const { status } = req.body;

        const updateData = { status };

        if (status === 'rejected') {
            updateData.assigned_agent_id = null;
            updateData.status = 'pending'; // Reset so Python engine or dispatch can re-assign
        }

        const cluster = await Cluster.findOneAndUpdate(
            { cluster_id: cluster_id },
            { $set: updateData },
            { new: true }
        );

        if (!cluster) {
            return res.status(404).json({ error: 'Cluster not found' });
        }

        res.json(cluster);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
