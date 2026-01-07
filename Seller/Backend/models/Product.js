const mongoose = require('mongoose');

// Connect specifically to the Products database
const productDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String, // e.g., "Vegetables", "Meat", "Dairy"
        required: true
    },
    // Pricing
    originalPrice: {
        type: Number, // MRP
        required: false
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number, // Percentage
        default: 0
    },

    // Quantity & Unit Specs
    quantity: {
        type: Number, // e.g. 1 (for 1 kg)
        required: true
    },
    unit: {
        type: String, // e.g. "kg", "pack", "liter"
        required: true
    },
    minimumOrderQuantity: {
        type: Number,
        default: 1
    },

    // Inventory
    stockQuantity: { // Available Stock
        type: Number,
        required: true,
        default: 0
    },

    // Specific Attributes
    preparationTime: {
        type: String // e.g., "15 mins"
    },
    cutType: {
        type: String, // e.g., "Boneless", "Curry Cut", "With Skin" (Relevant for Meat/Fish)
        required: false
    },
    meatType: {
        type: String, // e.g., "Chicken", "Mutton"
        required: false
    },

    // Details
    freshnessGuarantee: {
        type: String
    },
    storageInstructions: {
        type: String
    },
    shelfLife: {
        type: String
    },

    // Features & Media
    features: [{
        key: String,
        value: String
    }],
    images: [{
        type: String // Array of Cloudinary URLs
    }],

    // System Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'forced-inactive'],
        default: 'active'
    },

    // Seller Links
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Seller'
    },
    sellerName: { type: String },
    storeName: { type: String },
    storeAddress: { type: String },
    sellerUniqueId: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true });

module.exports = productDB.model('products', productSchema);
