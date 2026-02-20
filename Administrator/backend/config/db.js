const mongoose = require('mongoose');
require('dotenv').config();

// Create connections
const usersDBURI = process.env.MONGODB_URI_Users;
const customerDBURI = process.env.MONGODB_URI_Customer;
const productsDBURI = process.env.MONGODB_URI_Products;
const adminDBURI = process.env.MONGODB_URI_admin;

const connectDB = async () => {
    try {
        await mongoose.connect(usersDBURI);
        console.log('MongoDB Connected to Users Database');
    } catch (err) {
        console.error('MongoDB Users Connection Error:', err);
        process.exit(1);
    }
};

const customerConn = mongoose.createConnection(customerDBURI);
customerConn.on('connected', () => console.log('MongoDB Connected to Customer Database'));
customerConn.on('error', (err) => console.error('MongoDB Customer Connection Error:', err));

const productsConn = mongoose.createConnection(productsDBURI);
productsConn.on('connected', () => console.log('MongoDB Connected to Products Database'));
productsConn.on('error', (err) => console.error('MongoDB Products Connection Error:', err));

const adminConn = mongoose.createConnection(adminDBURI);
adminConn.on('connected', () => console.log('MongoDB Connected to Admin Database'));
adminConn.on('error', (err) => console.error('MongoDB Admin Connection Error:', err));

module.exports = { connectDB, customerConn, productsConn, adminConn };
