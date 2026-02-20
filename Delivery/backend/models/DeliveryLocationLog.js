const mongoose = require('mongoose');

const deliveryLocationLogSchema = new mongoose.Schema({
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deliveryagent',
        required: true
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient querying by agent and time
deliveryLocationLogSchema.index({ agentId: 1, timestamp: -1 });

// TTL Index: Automatically delete documents after 24 hours (86400 seconds)
deliveryLocationLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('DeliveryLocationLog', deliveryLocationLogSchema);
