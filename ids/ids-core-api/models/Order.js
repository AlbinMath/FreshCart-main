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

const OrderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    status: {
        type: String,
        enum: ['pending', 'clustered', 'assigned', 'in_transit', 'delivered'],
        default: 'pending'
    },
    priority: { type: Number, default: 1 }, // 1 = Standard, 2 = Express
    volume: { type: Number, default: 1.0 }, // Size/Weight score
    deadline: { type: Date }
}, { timestamps: true });

// Add 2dsphere index for geospatial queries
OrderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', OrderSchema);
