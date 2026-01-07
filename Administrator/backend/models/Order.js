const mongoose = require('mongoose');
const { productsConn } = require('../config/db');

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: [{
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        image: String,
        sellerId: String
    }],
    totalAmount: Number,
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentStatus: { type: String, default: 'Pending' },
    paymentMethod: { type: String, default: 'COD' },
    status: { type: String, default: 'Pending' }
}, {
    timestamps: true,
    collection: 'Orders'
});

module.exports = productsConn.model('Order', orderSchema);
