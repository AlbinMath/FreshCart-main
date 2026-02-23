require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', require('./routes/orders'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/dispatch', require('./routes/dispatch'));

// WebSocket for real-time tracking
io.on('connection', (socket) => {
    console.log('A client connected', socket.id);

    // Client can join a specific room (e.g., dispatcher room, agent room)
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
    });
});

// Expose io to routes if needed
app.set('io', io);

// MongoDB Connection
const PORT = process.env.PORT || 2012;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ids-db';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Node.js Core API running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
