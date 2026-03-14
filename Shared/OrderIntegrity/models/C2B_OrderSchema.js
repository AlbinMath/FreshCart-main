// Shared/OrderIntegrity/models/C2B_OrderSchema.js
// Export a function that accepts the mongoose instance
module.exports = (mongoose) => {
    const c2bOrderSchema = new mongoose.Schema({
        c2bOrderId: {
            type: String,
            required: true,
            unique: true
        },
        proposal_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'CustomerProduceProposal'
        },
        customer_id: {
            type: String, // Matches customer's uid
            required: true
        },
        seller_id: {
            type: String, // Matches sellerUniqueId or _id
            required: true
        },
        agreedPrice: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        quantityUnit: {
            type: String,
            default: 'kg'
        },
        proposalTitle: {
            type: String,
            default: ''
        },
        sellerStoreName: { type: String },
        sellerAddress: { type: String },
        sellerPhone: { type: String },
        growerName: { type: String },
        growerPhone: { type: String },
        shippingStatus: {
            type: String,
            enum: ['Pending Drop-off', 'In Transit', 'Delivered'],
            default: 'Pending Drop-off'
        },
        paymentStatus: {
            type: String,
            enum: ['Escrow Held', 'Released to Customer', 'Refunded', 'Offline - Cash Payment', 'Cancelled (Offline)', 'Acquired - Pending Payment'],
            default: 'Escrow Held'
        },
        inspectionStatus: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        razorpayOrderId: {
            type: String
        },
        razorpayPaymentId: {
            type: String
        }
    }, {
        timestamps: true,
        collection: 'C2B_Orders'
    });

    return c2bOrderSchema;
};
