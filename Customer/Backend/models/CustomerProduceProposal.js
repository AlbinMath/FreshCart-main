// models/CustomerProduceProposal.js
const mongoose = require('mongoose');
const { customerConn } = require('../server'); // Using the Customer DB connection

const customerProduceProposalSchema = new mongoose.Schema({
    customer_id: {
        type: String, // String or ObjectId, matching User uid
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    images: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        required: true,
        // Categories matching the Seller productCategories (e.g. 'Fruits', 'Vegetables', 'Dairy')
    },
    quantityAvailable: {
        type: Number,
        required: true,
    },
    quantityUnit: {
        type: String,
        enum: ['kg', 'units', 'litres', 'dozens'],
        default: 'kg',
    },
    askingPrice: {
        type: Number,
        required: true,
    },
    harvestDate: {
        type: Date,
    },
    expirationDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Negotiation', 'Accepted', 'Rejected'],
        default: 'Pending'
    }
}, {
    timestamps: true,
    collection: 'CustomerProduceProposals'
});

const CustomerProduceProposal = customerConn.model('CustomerProduceProposal', customerProduceProposalSchema);

module.exports = CustomerProduceProposal;
