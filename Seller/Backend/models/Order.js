const mongoose = require('mongoose');

// Connect specifically to the Products database
const productDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

const orderSchema = new mongoose.Schema({
    // Changed 'products' to 'items' based on screenshot
    items: [{
        productId: {
            type: String, // Screenshot shows string ID
            required: true
        },
        productName: String,
        quantity: Number,
        price: Number,
        image: String, // Header image url from screenshot
        sellerId: {
            type: String, // Verify if ObjectId or String. Screenshot value has non-hex char? Keeping String to be safe.
            required: true
        }
    }],

    // Customer Info - Changed 'customerId' to 'userId'
    userId: {
        type: String, // Screenshot shows "W1Gt..."
        required: true
    },

    // Order Level Info
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        default: 'COD'
    },

    // Address - Structure matches screenshot
    shippingAddress: {
        name: String,      // was fullName
        street: String,    // was addressLine1
        city: String,
        state: String,
        zipCode: String,   // was pincode
        country: String
    },

    status: { // was orderStatus, screenshot shows 'status'
        type: String,
        default: 'Placed',
        enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    }

}, {
    timestamps: true,
    collection: 'Orders'
});

module.exports = productDB.model('Orders', orderSchema);
