const mongoose = require('mongoose');
const { announcementsDB } = require('../config/dbConnections');

const adminCommunicationSchema = new mongoose.Schema({
    sender: {
        type: String, // 'Admin' or 'Administrator' (or specific user ID/Name if needed, but requirements say generic roles/shared chat)
        required: true
    },
    message: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Administrator']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'Admin/Administrator Communication' // Explicit collection name as requested
});

// TTL Index: Expire after 7 days (604800 seconds)
adminCommunicationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = announcementsDB.model('AdminCommunication', adminCommunicationSchema);
