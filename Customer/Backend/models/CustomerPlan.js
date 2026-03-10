const mongoose = require('mongoose');
const { usersConn } = require('../server'); // Using users connection since Customer is part of it

const CustomerPlanSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'Customer' // Reference using uid
    },
    planId: {
        type: String,
        required: true
    },
    planName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        default: 0
    },
    activationDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    transactionId: {
        type: String,
        default: function () {
            return 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }
    }
}, { timestamps: true });

// Check if model already exists on the connection to avoid OverwriteModelError
const CustomerPlan = usersConn.models.CustomerPlan || usersConn.model('CustomerPlan', CustomerPlanSchema, 'CustomerPlans');
module.exports = CustomerPlan;
