const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    processedDate: {
        type: Date
    },
    adminNote: {
        type: String
    },
    transactionId: { // Optional: ID from admin once paid
        type: String
    }
}, { timestamps: true });

module.exports = withdrawalRequestSchema;
