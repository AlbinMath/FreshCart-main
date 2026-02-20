const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const taxRoutes = require('./routes/taxRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/v1/tax', taxRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Tax Calculation Service' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Tax Service running on port ${PORT}`);
});
