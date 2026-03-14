const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false, // Changed to false as external DB often uses 'sellerName'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse: true // Allows null/undefined values to not clash uniqueness
    },
    passwordHash: {
        type: String,
        required: true,
    },

    productCategories: {
        type: [String], // Array of strings e.g. ["Fruits", "Vegetables"]
        default: []
    },

    role: {
        type: String,
        default: 'seller',
    },
    sellerUniqueId: {
        type: String,
        unique: true,
        sparse: true
    },
    storeName: {
        type: String,
        required: false
    },
    sellerName: { type: String },
    contactPersonName: { type: String },
    phoneNumber: { type: String },
    businessType: { type: String },

    // Address & Location
    storeAddress: { type: String },
    pinCode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },

    // Operations
    deliveryMethod: { type: String },
    operatingHours: {
        type: [
            {
                day: { type: String }, // e.g. "Monday"
                open: { type: String }, // e.g. "09:00"
                close: { type: String }, // e.g. "20:00"
                isClosed: { type: Boolean, default: false }
            }
        ],
        default: []
    },

    storeLeave: {
        isActive: { type: Boolean, default: false },
        startDate: { type: String }, // ISO Date string or simple date
        endDate: { type: String },
        reason: { type: String }
    },

    // Legal & Licensing
    businessRegistrationNumberOrGST: { type: String },
    fssaiLicenseNumber: { type: String },
    panNumber: { type: String },

    // Banking
    bankAccountHolderName: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },

    isVerified: {
        type: Boolean,
        default: false
    },
    walletBalance: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
    collection: 'Seller'
});

// Match user entered password to hashed password in database
sellerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Encrypt password using bcrypt
sellerSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
