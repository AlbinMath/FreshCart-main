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

const ClusterSchema = new mongoose.Schema({
    cluster_id: { type: String, required: true, unique: true },
    centroid: { type: LocationSchema, required: true },
    order_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    assigned_agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
    route_sequence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    status: {
        type: String,
        enum: ['unassigned', 'assigned', 'completed'],
        default: 'unassigned'
    }
}, { timestamps: true });

ClusterSchema.index({ centroid: '2dsphere' });

module.exports = mongoose.model('Cluster', ClusterSchema);
