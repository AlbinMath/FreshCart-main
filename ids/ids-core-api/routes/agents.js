const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');

// Register a new agent
router.post('/', async (req, res) => {
    try {
        const agent = new Agent(req.body);
        await agent.save();
        res.status(201).json(agent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update an agent's location (continuous ping)
router.post('/update-location', async (req, res) => {
    try {
        const { agent_id, name, coordinates } = req.body;

        // Coordinates come in as [lng, lat] from Delivery app

        const agent = await Agent.findByIdAndUpdate(
            agent_id,
            {
                $set: {
                    'location.lng': coordinates[0],
                    'location.lat': coordinates[1],
                    'location.lastUpdated': new Date()
                }
            },
            { new: true }
        );

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Broadcast location update
        const io = req.app.get('io');
        if (io) {
            io.emit('agent_moved', { agent_id, coordinates, status: agent.status });
        }

        res.json(agent);
    } catch (error) {
        console.error("Location update err:", error);
        res.status(500).json({ error: error.message });
    }
});

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

// Get nearby agents (Dashboard might use this)
router.get('/nearby', async (req, res) => {
    try {
        const { lng, lat, radiusStr } = req.query; // Radius in meters
        const lngNum = parseFloat(lng);
        const latNum = parseFloat(lat);
        const radius = (parseFloat(radiusStr) || 5000) / 1000; // km

        if (isNaN(lngNum) || isNaN(latNum)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        const allAgents = await Agent.find({
            'location.lat': { $exists: true },
            'location.lng': { $exists: true }
        });

        const nearbyAgents = allAgents.filter(agent => {
            const dist = getHaversineDistance(
                latNum,
                lngNum,
                agent.location.lat,
                agent.location.lng
            );
            agent._doc.distance = dist; // Optional helpful flag
            return dist <= radius;
        });

        res.json(nearbyAgents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get assigned clusters for an agent
router.get('/:agent_id/assigned-cluster', async (req, res) => {
    try {
        const { agent_id } = req.params;
        const agent = await Agent.findById(agent_id);

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found in IDS' });
        }

        const Cluster = require('../models/Cluster');
        const Order = require('../models/Order');

        const assignedClusters = await Cluster.find({
            assigned_agent_id: agent._id,
            status: 'assigned'
        });

        res.json(assignedClusters);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
