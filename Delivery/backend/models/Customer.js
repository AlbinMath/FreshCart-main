const mongoose = require('mongoose');
const customerDB = require('../config/customerDB');

const customerSchema = new mongoose.Schema({
    // Flexible schema to capture potential fields
    userId: String,
    fullName: String,
    phoneNumber: String,
    email: String,
    address: Object
}, { strict: false });

module.exports = customerDB.model('Customer', customerSchema, 'customers');
// Note: Collection name guessed as 'customers'. If strictly 'Customer' from user prompt, implies DB name is Customer. Collection might be 'users' or 'customers'. trying 'customers' default or 'Customer' if implied.
// Trying 'Customer' (singular) or 'Customers' (plural). Mongoose pluralizes by default.
// If URI is .../Customer, that's the DB name. Collection likely 'users' or 'customers'.
// User said "MONGODB_URI_Users s Customer" -> maybe "Customer" collection in "Customer" DB?
// I'll stick with 'Customer' model, mongoose will look for 'customers'.
