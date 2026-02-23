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
        const { agent_id, coordinates, status } = req.body;
        const agent = await Agent.findOneAndUpdate(
            { agent_id },
            {
                'current_location.coordinates': coordinates,
                ...(status && { status })
            },
            { new: true }
        );

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Broadcast location update
        const io = req.app.get('io');
        if (io) {
            io.emit('agent_moved', { agent_id, coordinates, status });
        }

        res.json(agent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get nearby agents
router.get('/nearby', async (req, res) => {
    try {
        const { lng, lat, radiusStr } = req.query; // Radius in meters
        const lngNum = parseFloat(lng);
        const latNum = parseFloat(lat);
        const radius = parseFloat(radiusStr) || 5000; // default 5km

        if (isNaN(lngNum) || isNaN(latNum)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        const agents = await Agent.find({
            current_location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lngNum, latNum]
                    },
                    $maxDistance: radius
                }
            }
        });

        res.json(agents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
