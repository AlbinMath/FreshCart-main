const mongoose = require('mongoose');

const userDeliveryAgentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: { type: Date },
    contactNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Verified unique in Users DB
    residentialAddress: { type: String },
    pinCode: { type: String },
    vehicleRegistrationNumber: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
    accountHolderName: { type: String },
    status: { type: String, default: 'active' }, // Default status in Users DB
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'Deliveryagent' // Explicitly storing in 'Deliveryagent' collection in Users DB
});

const { usersDB } = require('../config/dbConnections');
module.exports = usersDB.model('UserDeliveryAgent', userDeliveryAgentSchema);
