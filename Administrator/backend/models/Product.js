const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    originalPrice: Number,
    sellingPrice: { type: Number, required: true },
    discount: Number,
    // Flash Sale fields
    activeFlashSale: { type: mongoose.Schema.Types.ObjectId, required: false },
    flashSalePrice: { type: Number, required: false },
    quantity: Number,
    unit: String,
    minimumOrderQuantity: Number,
    stockQuantity: { type: Number, default: 0 },
    preparationTime: String,
    cutType: String,
    meatType: String,
    freshnessGuarantee: String,
    storageInstructions: String,
    features: [String],
    images: [String],

    // Status fields
    status: {
        type: String,
        enum: ['active', 'inactive', 'forced-inactive'],
        default: 'active'
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },

    // Seller Info
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }, // If you have a Seller model
    sellerName: String,
    storeName: String,
    storeAddress: String,
    sellerUniqueId: String,

}, { timestamps: true });

const { productsConn } = require('../config/db');
module.exports = productsConn.model('Product', productSchema);
