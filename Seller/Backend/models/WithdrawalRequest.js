const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    sellerId: {
        type: String,
        required: true,
        index: true
    },
    sellerName: {
        type: String,
        required: true
    },
    sellerUniqueId: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        upiId: String
    },
    transactionId: {
        type: String
    },
    adminNote: {
        type: String
    },
    processedDate: {
        type: Date
    }
}, {
    timestamps: true,
    collection: 'SellerWithdrawals'
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
