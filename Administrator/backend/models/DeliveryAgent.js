const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    contactNumber: String,
    residentialAddress: String,
    vehicleRegistrationNumber: String,
    pinCode: String,
    status: String,
    accountHolderName: String,
    bankAccountNumber: String,
    ifscCode: String,
    upiId: String,
    dateOfBirth: Date
}, { collection: 'Deliveryagent', strict: false });

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
