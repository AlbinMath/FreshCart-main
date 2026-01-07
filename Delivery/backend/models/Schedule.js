const mongoose = require('mongoose');
const deliveryAgentDB = require('../config/deliveryAgentDB');

const scheduleSchema = new mongoose.Schema({
    agentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    slots: {
        type: [String], // Array of time strings, e.g., ["06:00 AM - 08:00 AM"]
        default: []
    }
}, { timestamps: true });

// Ensure unique schedule per agent per day
scheduleSchema.index({ agentId: 1, date: 1 }, { unique: true });

module.exports = deliveryAgentDB.model('Schedule', scheduleSchema);
