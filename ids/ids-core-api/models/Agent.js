const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    }
});

const AgentSchema = new mongoose.Schema({
    agent_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    current_location: { type: LocationSchema, required: true },
    status: {
        type: String,
        enum: ['offline', 'available', 'busy'],
        default: 'available'
    },
    capacity: { type: Number, required: true }, // Total capacity rating
    current_load: { type: Number, default: 0 } // Currently assigned load
}, { timestamps: true });

AgentSchema.index({ current_location: '2dsphere' });

module.exports = mongoose.model('Agent', AgentSchema);
