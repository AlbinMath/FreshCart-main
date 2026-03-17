const mongoose = require('mongoose');

const userSellerSchema = new mongoose.Schema({
    sellerName: { type: String },
    contactPersonName: { type: String },
    phoneNumber: { type: String },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    businessType: { type: String },
    storeName: { type: String },
    businessRegistrationNumberOrGST: { type: String },
    fssaiLicenseNumber: { type: String },
    operatingHours: { type: String },
    storeAddress: { type: String },
    pinCode: { type: String },
    deliveryMethod: { type: String },
    bankAccountHolderName: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
    panNumber: { type: String },
    productCategories: { type: [String] },
    status: { type: String, default: 'active' }, // Default status in Users DB
    idProofStatus: { type: String },
    gstDocumentStatus: { type: String },
    fssaiLicenseStatus: { type: String },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'Seller' // Explicitly storing in 'Seller' collection in Users DB
});

const { usersDB } = require('../config/dbConnections');
module.exports = usersDB.model('UserSeller', userSellerSchema);
