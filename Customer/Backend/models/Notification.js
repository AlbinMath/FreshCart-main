const mongoose = require('mongoose');
const { usersConn } = require('../server');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
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
