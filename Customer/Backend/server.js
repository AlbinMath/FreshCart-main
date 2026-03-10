const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// Dual database connections
const usersConn = mongoose.createConnection(process.env.MONGODB_URI_Users);
const customerConn = mongoose.createConnection(process.env.MONGODB_URI_Customer);
const productsConn = mongoose.createConnection(process.env.MONGODB_URI_Products);
const chatbotConn = mongoose.createConnection(process.env.MONGODB_URI_ChatBot);
const announcementsConn = mongoose.createConnection(process.env.MONGODB_URI_Announcements);
const adminConn = mongoose.createConnection(process.env.MONGODB_URI_admin);

usersConn.on('connected', () => console.log('MongoDB Connected to Users Database'));
customerConn.on('connected', () => console.log('MongoDB Connected to Customer Database'));
productsConn.on('connected', () => console.log('MongoDB Connected to Products Database'));
chatbotConn.on('connected', () => console.log('MongoDB Connected to ChatBot Database'));
announcementsConn.on('connected', () => console.log('MongoDB Connected to Announcements Database'));
adminConn.on('connected', () => console.log('MongoDB Connected to Admin Database'));

// Export connections for models
module.exports = { usersConn, customerConn, productsConn, chatbotConn, announcementsConn, adminConn };

// Routes
app.get('/', (req, res) => {
    res.send('FreshCart Customer Backend is Running');
});

// Import Routes
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes');
const cartRoutes = require('./routes/cartRoutes');

app.use('/api/users', userRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/cart', cartRoutes);

const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);

const premiumPlanRoutes = require('./routes/premiumPlanRoutes');
app.use('/api/public/premium-plans', premiumPlanRoutes);

const marketingRoutes = require('./routes/marketingRoutes');
app.use('/api/marketing', marketingRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
