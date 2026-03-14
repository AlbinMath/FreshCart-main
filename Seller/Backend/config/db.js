const mongoose = require('mongoose');
require('dotenv').config();

// Dedicated connection to the Products database (same cluster as Admin)
// FlashSales created by Admin are stored in Products > flashsales
const productsConn = mongoose.createConnection(process.env.MONGODB_URI_Products);
productsConn.on('connected', () => console.log('Seller Backend: Connected to Products Database'));
productsConn.on('error', (err) => console.error('Seller Backend Products DB Error:', err));

const usersConn = mongoose.createConnection(process.env.MONGODB_URI_Users);
usersConn.on('connected', () => console.log('Seller Backend: Connected to Users Database'));
usersConn.on('error', (err) => console.error('Seller Backend Users DB Error:', err));

module.exports = { productsConn, usersConn };
