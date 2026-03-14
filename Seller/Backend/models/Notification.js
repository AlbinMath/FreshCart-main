const mongoose = require('mongoose');
const { usersConn } = require('../config/db');

const notificationSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Seller'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: false
    },
    title: {
        type: String,
        required: false
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'low_stock'],
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// Use usersConn to ensure it's in the same DB as the Admin's notifications
module.exports = usersConn.models.Notification || usersConn.model('Notification', notificationSchema);
