const mongoose = require('mongoose');

// Connect to the Products database (assuming reviews are stored there)
const productDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

const reviewSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    productId: {
        type: String,
        required: true
    },
    productRate: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    qualityRate: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    deliveryRate: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    overallRate: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    likeFeatures: [{
        type: String
    }],
    reviewText: {
        type: String,
        required: true
    },
    suggestion: {
        type: String
    },
    deliveryReview: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'Reviews'
});

module.exports = productDB.model('Reviews', reviewSchema);
