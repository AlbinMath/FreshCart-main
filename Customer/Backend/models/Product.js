const mongoose = require('mongoose');
const { productsConn } = require('../server');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    originalPrice: { type: Number },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number },
    // Flash Sale fields — needed to query and display flash sale prices
    activeFlashSale: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashSale', required: false },
    flashSalePrice: { type: Number, required: false },
    quantity: { type: Number },
    unit: { type: String },
    minimumOrderQuantity: { type: Number },
    stockQuantity: { type: Number, required: true },
    orderCount: { type: Number, default: 0 },
    preparationTime: { type: String },
    cutType: { type: String },
    meatType: { type: String },
    freshnessGuarantee: { type: String },
    storageInstructions: { type: String },
    features: [{ type: String }],
    images: [{ type: String }],
    status: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId },
    sellerName: { type: String },
    storeName: { type: String },
    storeAddress: { type: String },
    sellerUniqueId: { type: String },
    product_id: { type: String },
    shelfLife: { type: String },
    approvalStatus: { type: String }
}, {
    timestamps: true
});

const Product = productsConn.model('Product', productSchema, 'products'); // Explicit collection name
module.exports = Product;
