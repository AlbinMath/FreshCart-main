const mongoose = require('mongoose');

// Connect to the Products database (as requested for storing notifications)
const productDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

const notificationSchema = new mongoose.Schema({
    sellerId: {
        type: String, // Storing as String to match how other IDs are often handled, or ObjectId if robust
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products' // Optional ref, but good for population if needed
    },
    type: {
        type: String, // e.g., 'low_stock'
        default: 'low_stock'
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30 // Optional: Auto-delete after 30 days? Let's leave it per user request "CLEAR BUTTON". Maybe no expiry.
    }
}, {
    timestamps: true,
    collection: 'notifications'
});

module.exports = productDB.model('notifications', notificationSchema);
