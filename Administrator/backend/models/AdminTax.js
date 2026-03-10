const mongoose = require('mongoose');

const adminTaxSchema = new mongoose.Schema({
    region: { type: String, required: true, unique: true },
    taxRate: { type: Number, required: true }, // Percentage (e.g., 18 for 18%)
    taxType: { type: String, enum: ['GST', 'VAT', 'Sales Tax'], default: 'GST' },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminTax', adminTaxSchema);
