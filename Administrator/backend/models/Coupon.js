const mongoose = require('mongoose');
const { productsConn } = require('../config/db');

const couponSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: false // If null, it's a platform-wide admin coupon
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
        // Removed unique: true because different sellers might accidentally use the same code. 
        // We will handle uniqueness based on sellerId + code later if needed.
    },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    // RECURRING VALIDITY
    startYear: {
        type: Number,
        required: true, // e.g., 2025
        default: new Date().getFullYear()
    },
    validFromDate: {
        type: String,
        required: true, // Format: "MM-DD", e.g., "12-30"
        match: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    },
    validToDate: {
        type: String,
        required: true, // Format: "MM-DD", e.g., "01-05"
        match: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    },
    // LIMITS
    maxUsesPerUser: {
        type: Number,
        default: 1 // default 1 use per user
    },
    keywords: [{
        type: String,
        trim: true
    }],
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Use the products connection
const Coupon = productsConn.model('Coupon', couponSchema);

module.exports = Coupon;
