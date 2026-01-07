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
app.use('/api/marketing', require('./routes/marketing'));


app.get('/', (req, res) => {
    res.send('Administrator Backend Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
