// models/Address.js
const mongoose = require('mongoose');
const { customerConn } = require('../server');

const addressSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // reference to user uid
    name: { type: String, required: true },
    houseNumber: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    latitude: { type: Number },
    longitude: { type: Number },
    isDefault: { type: Boolean, default: false }
});

// Use the customer connection to create the model in the Customer DB
const Address = customerConn.model('Address', addressSchema, 'address');
module.exports = Address;
