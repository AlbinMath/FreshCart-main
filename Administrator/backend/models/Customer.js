const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    role: { type: String },
    isVerified: { type: Boolean },

}, { collection: 'Customer', strict: false });

module.exports = mongoose.model('Customer', customerSchema);
