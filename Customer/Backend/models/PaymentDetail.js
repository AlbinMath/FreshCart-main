// models/PaymentDetail.js
const mongoose = require('mongoose');
const { customerConn } = require('../server');

const paymentDetailSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // reference to user uid
    type: { type: String, enum: ['UPI', 'BANK'], required: true },
    details: { type: String, required: true }, // Encrypted JSON string
    iv: { type: String, required: true },      // Initialization vector
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Use the customer connection to create the model in the Customer DB
const PaymentDetail = customerConn.model('PaymentDetail', paymentDetailSchema, 'paymentDetails');
module.exports = PaymentDetail;
