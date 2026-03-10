const mongoose = require('mongoose');
const { productsConn } = require('../server');

const couponSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: false
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
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
    startYear: {
        type: Number,
        required: true,
        default: new Date().getFullYear()
    },
    validFromDate: {
        type: String,
        required: true,
        match: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    },
    validToDate: {
        type: String,
        required: true,
        match: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    },
    maxUsesPerUser: {
        type: Number,
        default: 1
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

const Coupon = productsConn.model('Coupon', couponSchema);
module.exports = Coupon;
