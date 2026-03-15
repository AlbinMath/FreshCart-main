const mongoose = require('mongoose');

const CustomerPlanSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'Customer'
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
        type: String
    }
}, { timestamps: true, collection: 'CustomerPlans' });

module.exports = mongoose.model('CustomerPlan', CustomerPlanSchema);
