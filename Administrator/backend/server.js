const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const { connectDB } = require('./config/db');
connectDB(); // Connect to Users Database

// Note: Secondary connections (Customer, Products) are initialized in config/db.js
// and imported directly by models to avoid circular dependencies.


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
const marketingRouter = require('./routes/marketing');
app.use('/api/marketing', marketingRouter);
app.use('/api/antigravity', require('./routes/ledgerRoutes'));
app.use('/api/premium-plans', require('./routes/premiumPlans'));

// New Admin Logic Routes
app.use('/api/admin/sellers', require('./routes/adminSellers'));
app.use('/api/admin/customers', require('./routes/adminCustomers'));
app.use('/api/admin/payments', require('./routes/adminPayments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));


app.get('/', (req, res) => {
    res.send('Administrator Backend Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Flash Sale Status Auto-Updater
    const { autoUpdateFlashSaleStatuses } = marketingRouter;
    // Run immediately on startup to catch any missed transitions
    setTimeout(autoUpdateFlashSaleStatuses, 3000);
    // Then run every 60 seconds
    setInterval(autoUpdateFlashSaleStatuses, 60 * 1000);
    console.log('[Flash Sale Scheduler] Auto-status updater started (every 60s)');
});

