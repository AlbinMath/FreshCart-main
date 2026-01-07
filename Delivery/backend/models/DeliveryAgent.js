const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: { type: String }, // Using String as per image "2002-06-29T..."
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    residentialAddress: { type: String },
    pinCode: { type: String },
    vehicleRegistrationNumber: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
    accountHolderName: { type: String },
    status: { type: String, default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Deliveryagent', deliveryAgentSchema, 'Deliveryagent');
