const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const productsDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

productsDB.on('connected', () => {
    console.log('Connected to MongoDB (Products)');
});

productsDB.on('error', (err) => {
    console.error('MongoDB (Products) connection error:', err);
});

module.exports = productsDB;
