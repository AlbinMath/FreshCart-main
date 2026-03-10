const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const deliveryAgentRoutes = require('./routes/deliveryAgentRoutes');

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Wrap express app
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (adjust for production)
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5007;

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI_Users)
// Routes
app.use('/api/delivery-agent', deliveryAgentRoutes);

const DeliveryLocationLog = require('./models/DeliveryLocationLog');
const DeliveryAgent = require('./models/DeliveryAgent');

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for location updates
    socket.on('updateLocation', async (data) => {
        // data: { agentId, location: { lat, lng } }
        console.log('Server: Received location update:', data);

        // Broadcast location to specific rooms or all clients (e.g., admin dashboard)
        // For now, we broadcast to everyone for simplicity
        io.emit('agentLocationUpdate', data);

        // Push location to IDS cluster engine
        try {
            if (data.agentId && data.location && data.location.lat && data.location.lng) {
                const agentDoc = await DeliveryAgent.findById(data.agentId);
                const agentName = agentDoc ? (agentDoc.fullName || 'Delivery Agent') : 'Delivery Agent';

                await axios.post(`${process.env.IDS_CORE_API_URL || 'http://localhost:2012'}/api/agents/update-location`, {
                    agent_id: data.agentId,
                    name: agentName,
                    capacity: 10,
                    coordinates: [data.location.lng, data.location.lat],
                    status: 'available'
                });
            }
        } catch (idsErr) {
            console.error(`[IDS] Failed to push Agent location:`, idsErr.message);
        }

        try {
            // Update the agent's current location in DeliveryAgent collection
            // We do this so we can quickly get the "last known location"
            await DeliveryAgent.findByIdAndUpdate(data.agentId, {
                location: {
                    lat: data.location.lat,
                    lng: data.location.lng,
                    lastUpdated: new Date()
                }
            });

            // Log the location history
            const logEntry = new DeliveryLocationLog({
                agentId: data.agentId,
                location: {
                    lat: data.location.lat,
                    lng: data.location.lng
                }
            });
            await logEntry.save();
            // console.log('Location logged to DB');
        } catch (err) {
            console.error('Error saving location update:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Delivery Agent Backend is running');
});

const Schedule = require('./models/Schedule');

// ... (existing imports)

// Auto-Offline Logic (Check every minute)
setInterval(async () => {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = now.toISOString().split('T')[0];

        // Find all online agents
        const onlineAgents = await DeliveryAgent.find({ isOnline: true });

        for (const agent of onlineAgents) {
            // Get today's schedule
            const schedule = await Schedule.findOne({ agentId: agent._id, date: todayStr });

            let isWithinSlot = false;

            if (schedule && schedule.slots && schedule.slots.length > 0) {
                // Check if current time is within ANY slot
                isWithinSlot = schedule.slots.some(slot => {
                    // Helper to parse "10:00 AM" to 10
                    const parseTime = (tStr) => {
                        const [time, modifier] = tStr.split(' ');
                        let [hours, minutes] = time.split(':');
                        if (hours === '12') hours = '00';
                        let h = parseInt(hours, 10);
                        if (modifier === 'PM') h += 12;
                        return h;
                    };

                    const [startStr, endStr] = slot.split(' – '); // Note: Ensure dash char matches DB
                    // If DB uses different dash, handle it. Assuming " – " (en dash) based on user input or standard
                    if (!startStr || !endStr) return false;

                    const startH = parseTime(startStr);
                    const endH = parseTime(endStr);

                    return currentHour >= startH && currentHour < endH;
                });
            }

            // If not in a slot, force offline
            if (!isWithinSlot) {
                console.log(`Auto-offlining agent ${agent.fullName} (ID: ${agent._id})`);
                agent.isOnline = false;
                await agent.save();
                io.emit('agentStatusUpdate', { agentId: agent._id, isOnline: false });
            }
        }
    } catch (err) {
        console.error("Auto-offline check error:", err);
    }
}, 60 * 1000); // Run every minute

server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
