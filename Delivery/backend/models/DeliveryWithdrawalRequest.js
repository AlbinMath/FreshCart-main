const mongoose = require('mongoose');

const deliveryWithdrawalSchema = new mongoose.Schema({
    agentId: { type: String, required: true },
    agentName: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        upiId: String
    },
    adminNote: String,
    transactionId: String,
    processedDate: Date
}, { timestamps: true });

module.exports = mongoose.model('DeliveryWithdrawalRequest', deliveryWithdrawalSchema, 'DeliveryWithdrawalRequests');
