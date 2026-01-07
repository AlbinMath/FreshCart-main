const mongoose = require('mongoose');
const { productsConn } = require('../config/db');

const bundleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        }
    }],
    bundlePrice: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Bundle = productsConn.model('Bundle', bundleSchema);

module.exports = Bundle;
