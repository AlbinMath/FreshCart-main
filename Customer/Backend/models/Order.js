const mongoose = require('mongoose');
const { productsConn } = require('../server');

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
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        name: String,
        houseNumber: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentStatus: { type: String, default: 'Pending' }, // Pending, Paid, Failed
    paymentMethod: { type: String, enum: ['COD', 'Online'], default: 'Online' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: { type: String, default: 'Placed' }, // Placed, Processing, Shipped, Delivered
    createdAt: { type: Date, default: Date.now }
});

// Create model in Products Database, collection 'Orders'
const Order = productsConn.model('Order', orderSchema, 'Orders');

module.exports = Order;
