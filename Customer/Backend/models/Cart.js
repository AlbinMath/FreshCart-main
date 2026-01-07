const mongoose = require('mongoose');
const { customerConn } = require('../server');

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, required: true },
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
        stock: { type: Number }, // To check availability
        sellerId: { type: mongoose.Schema.Types.ObjectId }
    }]
}, {
    timestamps: true
});

const Cart = customerConn.model('Cart', cartSchema, 'Cart');
module.exports = Cart;
