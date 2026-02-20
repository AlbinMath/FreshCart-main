const mongoose = require('mongoose');
const productsDB = require('../config/productsDB');

const productSchema = new mongoose.Schema({
    productName: String,
    description: String,
    category: String,
    originalPrice: Number,
    sellingPrice: Number,
    discount: Number,
    quantity: Number,
    unit: String,
    minimumOrderQuantity: Number,
    stockQuantity: Number,
    preparationTime: String,
    cutType: String,
    meatType: String,
    freshnessGuarantee: String,
    storageInstructions: String,
    features: [{
        key: String,
        value: String
    }],
    images: [String],
    status: String,
    sellerId: mongoose.Schema.Types.ObjectId,
    sellerName: String,
    storeName: String,
    storeAddress: String,
    sellerUniqueId: String,
    shelfLife: String,
    approvalStatus: String
}, { timestamps: true });

module.exports = productsDB.model('Product', productSchema, 'products');
