const mongoose = require('mongoose');

const adminCustomerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive', 'Banned'], default: 'Active' },
    registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminCustomer', adminCustomerSchema);
