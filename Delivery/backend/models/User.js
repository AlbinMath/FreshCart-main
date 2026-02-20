const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: String,
    phoneNumber: String,
    email: String,
    // Add other fields as needed, strict: false allows for flexibility
}, { strict: false });

module.exports = mongoose.model('User', userSchema, 'Users');
