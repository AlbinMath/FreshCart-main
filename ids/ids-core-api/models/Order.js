const mongoose = require('mongoose');

const productDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

const OrderSchema = new mongoose.Schema({
    items: [{
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        sellerId: String
    }],
    userId: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        latitude: Number,
        longitude: Number
    },
    status: {
        type: String,
        default: 'Placed'
    },
    orderId: { type: String, unique: true, sparse: true },
    deliveryAgentId: { type: String }
}, { timestamps: true, collection: 'Orders' });

module.exports = productDB.model('Order', OrderSchema);
