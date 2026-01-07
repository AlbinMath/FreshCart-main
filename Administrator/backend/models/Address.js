const mongoose = require('mongoose');
const { customerConn } = require('../config/db');

const addressSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // Links to Customer.uid
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
}, { collection: 'address', strict: false });

module.exports = customerConn.model('address', addressSchema);
