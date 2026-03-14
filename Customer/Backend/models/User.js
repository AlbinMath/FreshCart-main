// models/User.js
const mongoose = require('mongoose');
const { usersConn } = require('../server');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    phoneNumber: { type: String },
    role: { type: String, enum: ['customer'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    walletBalance: { type: Number, default: 0 },
    // addresses will be stored in separate collection (Customer DB)
});

// Use the users connection to create the model in the Users DB
const CustomerHelper = usersConn.model('Customer', userSchema, 'Customer');
module.exports = CustomerHelper;
