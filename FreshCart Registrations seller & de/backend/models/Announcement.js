const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: { // Changed from 'message' to 'content' to match frontend usage
        type: String,
        required: true
    },
    date: {
        type: String, // Storing as string YYYY-MM-DD for consistency with frontend mock
        required: true
    },
    author: {
        type: String,
        required: true // Storing author email/name directly for simplicity
    }
}, {
    timestamps: true,
    collection: 'Announcements'
});

// Calculate expiration based on createdAt if needed, but for now simple storage
// keeping the existing expiration index logic if desired, or removing if we want permanent posts
// The previous route had: announcementSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });
// I will keep it.
announcementSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const { announcementsDB } = require('../config/dbConnections');
module.exports = announcementsDB.model('Announcement', announcementSchema);
