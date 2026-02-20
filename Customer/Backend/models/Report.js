const mongoose = require('mongoose');
const { announcementsConn } = require('../server');

const reportSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    reportId: {
        type: String,
        unique: true,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String
    },
    issueType: {
        type: String,
        required: true,
        enum: ['Wrong Product', 'Delivery Issue', 'Refund Issue', 'Website Issue', 'Other']
    },
    orderId: {
        type: String,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = announcementsConn.model('Report', reportSchema);
