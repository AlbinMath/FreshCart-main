const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    sellerName: String,
    contactPersonName: String,
    phoneNumber: String,
    email: String,
    storeName: String,
    storeAddress: String,
    pinCode: String,
    businessType: String,
    businessRegistrationNumberOrGST: String,
    fssaiLicenseNumber: String,
    operatingHours: String,
    storeAddress: String,
    pinCode: String,
    deliveryMethod: String,
    bankAccountHolderName: String,
    bankAccountNumber: String,
    ifscCode: String,
    upiId: String,
    panNumber: String,
    productCategories: [String],
    status: String,
    idProofStatus: String,
    gstDocumentStatus: String,
    fssaiLicenseStatus: String
}, { collection: 'Seller', strict: false });

module.exports = mongoose.model('Seller', sellerSchema);
