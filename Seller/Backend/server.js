const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
// Uses MONGODB_URI_Users for user data (customers, sellers)
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI_Users);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const { usersConn } = require('./config/db');

module.exports = { usersConn };

// Routes
app.get('/', (req, res) => {
    res.send('Seller Backend API is running...');
});

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const reviewRoutes = require('./routes/review');
const Order = require('./models/Order'); // Import Order model for Change Stream

app.use('/api/seller', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/sourcing', require('./routes/sourcingRoutes'));
app.use('/api/withdrawals', require('./routes/withdrawal'));

// Start Server
connectDB().then(() => {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins (update for production if needed)
            methods: ["GET", "POST"]
        }
    });

    // Socket.io Logic
    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('join_seller_room', (sellerId) => {
            if (sellerId) {
                socket.join(sellerId);
                console.log(`User with ID: ${socket.id} joined room: ${sellerId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log("User Disconnected", socket.id);
        });
    });

    // MongoDB Change Stream for Real-time Notifications
    try {
        const changeStream = Order.watch();

        changeStream.on('change', (change) => {
            if (change.operationType === 'insert') {
                const orderDetails = change.fullDocument;

                // Notify each seller involved in the order
                if (orderDetails.items && orderDetails.items.length > 0) {
                    // Get unique seller IDs from the order
                    const sellerIds = [...new Set(orderDetails.items.map(item => item.sellerId))];

                    sellerIds.forEach(sellerId => {
                        // Create notification payload
                        const notification = {
                            id: Date.now() + Math.random(), // Unique ID
                            type: 'info',
                            title: 'New Order Received',
                            description: `Order #${orderDetails._id.toString().slice(-6)} has been placed.`,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            read: false,
                            orderId: orderDetails._id
                        };

                        io.to(sellerId).emit('newOrder', notification);
                        console.log(`Notification sent to seller: ${sellerId}`);
                    });
                }
            }
        });

        changeStream.on('error', (error) => {
            console.error('Change Stream Error:', error);
        });

    } catch (e) {
        console.error("Failed to setup change stream", e);
    }

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
