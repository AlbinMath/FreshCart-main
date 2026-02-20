const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const customerDB = mongoose.createConnection(process.env.MONGODB_URI_Customer);

customerDB.on('connected', () => {
    console.log('Connected to MongoDB (Customer)');
});

customerDB.on('error', (err) => {
    console.error('MongoDB (Customer) connection error:', err);
});

module.exports = customerDB;
