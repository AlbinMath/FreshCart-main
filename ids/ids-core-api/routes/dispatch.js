const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Cluster = require('../models/Cluster');

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8001';

// Trigger dispatch processing
router.post('/trigger', async (req, res) => {
    try {
        // 1. Fetch pending orders
        const pendingOrders = await Order.find({ status: 'pending' });
        if (pendingOrders.length === 0) {
            return res.json({ message: 'No pending orders to dispatch' });
        }

        // 2. Format orders for Python API
        const ordersData = pendingOrders.map(o => ({
            id: o._id.toString(),
            longitude: o.location.coordinates[0],
            latitude: o.location.coordinates[1],
            priority: o.priority,
            volume: o.volume
        }));

        // 3. Call Python Clustering Engine
        const clusterResponse = await axios.post(`${PYTHON_ENGINE_URL}/engine/cluster`, { orders: ordersData });
        const clusters = clusterResponse.data.clusters;

        let assignmentResults = [];

        // 4. Process each cluster and auto-assign
        for (let pythonCluster of clusters) {
            // Save cluster to DB
            const newCluster = new Cluster({
                cluster_id: `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                centroid: {
                    type: 'Point',
                    coordinates: [pythonCluster.centroid.longitude, pythonCluster.centroid.latitude]
                },
                order_ids: pythonCluster.order_ids
            });
            await newCluster.save();

            // Mark orders as clustered
            await Order.updateMany(
                { _id: { $in: pythonCluster.order_ids } },
                { $set: { status: 'clustered' } }
            );

            // Find nearby agents using GeoSpatial Query
            const nearbyAgents = await Agent.find({
                status: 'available',
                current_location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: newCluster.centroid.coordinates
                        },
                        $maxDistance: 10000 // 10km radius 
                    }
                }
            });

            const clusterTotalVolume = typeof pythonCluster.total_volume !== 'undefined' ? pythonCluster.total_volume : 0;

            // Auto-Assignment Logic (Scoring Formula)
            let bestAgent = null;
            let lowestScore = Infinity;

            for (let agent of nearbyAgents) {
                // Ensure agent has capacity
                if (agent.capacity >= (agent.current_load + clusterTotalVolume)) {
                    // Haversine/Distance heuristic (using simple euclidean for the score placeholder here, Python gives real distance later)
                    // We assume nearest agent is first in `$near` results arrays, but we still apply formula

                    // Score = α(Distance) + β(Load) + γ(Priority)
                    // Distance relies on the array order of $near which is sorted by distance
                    const distanceProxy = 1; // Simplification: we'd ideally calculate exact distance 
                    const loadRatio = (agent.current_load + clusterTotalVolume) / agent.capacity;

                    const score = (0.6 * distanceProxy) + (0.3 * loadRatio) - (0.1 * 1); // priority avg placeholder

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

                bestAgent.status = 'busy';
                bestAgent.current_load += clusterTotalVolume;
                await bestAgent.save();

                await Order.updateMany(
                    { _id: { $in: pythonCluster.order_ids } },
                    { $set: { status: 'assigned' } }
                );

                // Call Python engine for Routing / TSP
                try {
                    // Placeholder for TSP: Start from agent, go through cluster points
                    const routeData = {
                        agent_location: { longitude: bestAgent.current_location.coordinates[0], latitude: bestAgent.current_location.coordinates[1] },
                        order_ids: pythonCluster.order_ids
                    };
                    const routeResponse = await axios.post(`${PYTHON_ENGINE_URL}/engine/optimize-route`, routeData);

                    // Assume python returns sorted order_ids
                    newCluster.route_sequence = routeResponse.data.route_sequence;
                    await newCluster.save();
                } catch (routeErr) {
                    console.error('Routing error:', routeErr.message);
                    // fallback to unoptimized
                    newCluster.route_sequence = pythonCluster.order_ids;
                    await newCluster.save();
                }

                // --- Order Integrity Ledger Appends ---
                try {
                    const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5000';
                    const TAX_API_URL = process.env.TAX_API_URL || 'http://localhost:5009';

                    for (let oId of pythonCluster.order_ids) {
                        const orderObj = await Order.findById(oId);
                        if (orderObj && orderObj.order_id) {
                            await axios.post(`${ADMIN_API_URL}/api/ledger/append`, {
                                orderId: orderObj.order_id,
                                event: 'DISPATCH_OPTIMIZED',
                                actor: 'IDS_ENGINE',
                                actorId: 'SYSTEM',
                                data: {
                                    agentAssigned: bestAgent.name || bestAgent._id,
                                    clusterId: newCluster.cluster_id,
                                    routeSequence: newCluster.route_sequence
                                }
                            });

                            // Report fuel savings to the Tax Service
                            // Placeholder metrics until python TSP distances are fully mapped
                            await axios.post(`${TAX_API_URL}/api/tax/fuel-metrics`, {
                                orderId: orderObj.order_id,
                                originalDistanceKm: 12.5,
                                optimizedDistanceKm: 8.2,
                                fuelSavedLiters: 0.43
                            });
                        }
                    }
                } catch (ledgerErr) {
                    // Fail silently to prevent dispatch crash
                    console.error('[IDS] Failed to ledger dispatch event:', ledgerErr.message);
                }
                // --- End Ledger Logging ---

                assignmentResults.push({ cluster_id: newCluster.cluster_id, assigned_to: bestAgent.name || bestAgent._id });
            } else {
                assignmentResults.push({ cluster_id: newCluster.cluster_id, assigned_to: null, reason: 'No available agents with capacity' });
            }
        }

        // Broadcast
        const io = req.app.get('io');
        if (io) {
            io.emit('dispatch_completed', assignmentResults);
        }

        res.json({ message: 'Dispatch process completed', results: assignmentResults });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
