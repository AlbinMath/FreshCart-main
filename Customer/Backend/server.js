const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

const { usersConn, customerConn, productsConn, chatbotConn, announcementsConn, adminConn } = require('./db');

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

const growerRoutes = require('./routes/growerRoutes');
app.use('/api/grower', growerRoutes);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
