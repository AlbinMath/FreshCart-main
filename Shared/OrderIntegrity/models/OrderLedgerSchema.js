// Shared/OrderIntegrity/models/OrderLedgerSchema.js
// Export a function that accepts the mongoose instance to avoid dependency resolution issues

module.exports = (mongoose) => new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    currentHash: { type: String, required: true },
    chain: [{
        index: Number,
        event: String,
        timestamp: Date,
        actor: String,
        actorId: String,
        data: Object,
        previousHash: String,
        hash: String
    }],
    verifiedByAdmin: { type: Boolean, default: false }
}, {
    timestamps: true
});
