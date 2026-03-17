const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  // Basic Seller Information
  sellerName: {
    type: String,
    required: true,
    trim: true
  },
  contactPersonName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true
  },
  businessType: {
    type: String,
    enum: ["individual", "partnership", "Retailer", "Wholesale Supplier", "Other"],
    required: true
  },

  // Business & Store Details
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  businessRegistrationNumberOrGST: {
    type: String
  },
  fssaiLicenseNumber: {
    type: String
  },
  categoryOfProducts: {
    type: String,
    enum: ["Meat & Fish", "Vegetables & Fruits", "Dairy", "All", "Other"]
  },
  productSource: {
    type: String
  },
  operatingHours: {
    type: String
  },

  // Address & Delivery Details
  storeAddress: {
    type: String
  },
  city: {
    type: String
  },
  pinCode: {
    type: String
  },
  serviceAreaRadius: {
    type: String
  },
  deliveryLocations: [{
    type: String
  }],
  deliveryMethod: {
    type: String,
    enum: ["Seller delivery", "Platform delivery"]
  },

  // Bank & Payment Details
  bankAccountHolderName: {
    type: String
  },
  bankAccountNumber: {
    type: String
  },
  ifscCode: {
    type: String
  },
  upiId: {
    type: String
  },
  panNumber: {
    type: String
  },

  // Product & Quality Verification
  sampleProductImageUrls: [{
    type: String
  }],
  productCategories: [{
    type: String
  }],
  pricingRange: {
    type: String
  },
  packagingProcessDetails: {
    type: String
  },
  storageRefrigerationDetails: {
    type: String
  },
  dailyStockCapacity: {
    type: String
  },

  // Documents Upload (all as Cloudinary URLs)
  idProofUrl: { type: String },
  idProofStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  gstDocumentUrl: { type: String },
  gstDocumentStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  ownershipProofUrl: { type: String },
  ownershipProofStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  bankAccountProofUrl: { type: String },
  bankAccountProofStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  shopPhotoUrl: { type: String },
  shopPhotoStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  fssaiLicenseUrl: { type: String },
  fssaiLicenseStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  tradeLicenseUrl: { type: String },
  tradeLicenseStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  // Status & Meta
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  statusReason: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  confirmedAt: {
    type: Date
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Administrator'
  }
}, {
  timestamps: true
});

const { registrationsDB } = require('../config/dbConnections');
module.exports = registrationsDB.model('Seller', sellerSchema);