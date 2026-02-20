const mongoose = require('mongoose');
const productsDB = require('../config/productsDB');

const orderSchema = new mongoose.Schema({
    // Defining common fields we expect, but keeping strict: false for flexibility
    userId: String,
    sellerId: String,
    items: Array,
    totalAmount: Number,
    status: {
        type: String,
        default: 'Placed'
    },
    address: Object,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: false });

module.exports = productsDB.model('Order', orderSchema, 'Orders');
