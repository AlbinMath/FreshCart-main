const mongoose = require('mongoose');
const productsDB = require('../config/productsDB');

const reviewSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    productId: { type: String, required: true },
    productRate: { type: Number, min: 1, max: 5 },
    qualityRate: { type: Number, min: 1, max: 5 },
    deliveryRate: { type: Number, required: true, min: 1, max: 5 },
    overallRate: { type: Number, required: true, min: 1, max: 5 },
    likeFeatures: [{ type: String }],
    reviewText: { type: String, required: true },
    suggestion: { type: String },
    deliveryReview: { type: String }
}, {
    timestamps: true,
    collection: 'Reviews'
});

module.exports = productsDB.model('Review', reviewSchema, 'Reviews');
