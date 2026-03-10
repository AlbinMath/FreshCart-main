const mongoose = require('mongoose');
const { productsConn } = require('../server');

const flashSaleSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: false // If null, it's a platform-wide admin flash sale
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    bannerImage: { type: String },
    status: {
        type: String,
        enum: ['Draft', 'Active', 'Paused', 'Ended'],
        default: 'Draft'
    },
    priority: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: 'IST' },
    autoActivate: { type: Boolean, default: true },
    autoExpire: { type: Boolean, default: true },
    salesTarget: { type: Number },
    saleTag: { type: String },
    approvalRequired: { type: Boolean, default: false },
    editLock: { type: Boolean, default: false },
    auditLog: { type: Boolean, default: true }
}, { timestamps: true });

const FlashSale = productsConn.model('FlashSale', flashSaleSchema);
module.exports = FlashSale;
