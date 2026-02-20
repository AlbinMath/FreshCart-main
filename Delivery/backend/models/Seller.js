const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    sellerName: String,
    storeName: String,
    storeAddress: String,
    latitude: Number,
    longitude: Number,
    phoneNumber: String
}, { strict: false }); // Strict false to accommodate existing data

module.exports = mongoose.model('Seller', sellerSchema, 'Seller'); // Access 'Seller' collection
