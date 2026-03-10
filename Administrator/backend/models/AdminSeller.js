const mongoose = require('mongoose');

const adminSellerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    storeDescription: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Pending', 'Suspended'], default: 'Pending' },
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminSeller', adminSellerSchema);
