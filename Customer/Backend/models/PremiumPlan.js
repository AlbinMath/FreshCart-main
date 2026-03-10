const mongoose = require('mongoose');
const { adminConn } = require('../server');

const PremiumPlanSchema = new mongoose.Schema({
    type: { type: String, enum: ['seller', 'customer'], required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    duration: { type: String, required: true },
    description: String,
    features: [String],
    color: { type: String, default: 'gray' },
    icon: { type: String, default: 'Truck' },
    recommended: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

// Map to premiumplans collection in AdministratorData DB
module.exports = adminConn.models.PremiumPlan || adminConn.model('PremiumPlan', PremiumPlanSchema, 'premiumplans');
