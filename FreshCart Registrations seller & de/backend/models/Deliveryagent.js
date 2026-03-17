const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  // Personal Details
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String
  },
  contactNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true
  },

  // Address & Location
  residentialAddress: {
    type: String
  },
  city: {
    type: String
  },
  pinCode: {
    type: String
  },

  // Identity Verification (KYC) – Cloudinary URLs
  identityProofType: {
    type: String,
    enum: ["Aadhaar", "Voter ID", "Driving License"]
  },
  identityProofUrl: {
    type: String
  },
  identityProofStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  panCardUrl: {
    type: String
  },
  panCardStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  photoUrl: {
    type: String
  },
  photoStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  digitalSignatureUrl: {
    type: String
  },
  digitalSignatureStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  // Vehicle Details
  vehicleType: {
    type: String,
    enum: ["bicycle", "scooter", "motorcycle", "car", "Bike", "Scooter", "Bicycle"]
  },
  vehicleRegistrationNumber: {
    type: String
  },
  rcBookUrl: {
    type: String
  },
  rcBookStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  drivingLicenseUrl: {
    type: String
  },
  drivingLicenseStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },

  insuranceDetails: {
    type: String
  },
  insuranceDetailsStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  vehicleFuelType: {
    type: String
  },

  // Bank / Payment Details
  bankAccountNumber: {
    type: String
  },
  ifscCode: {
    type: String
  },
  upiId: {
    type: String
  },
  accountHolderName: {
    type: String
  },

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
module.exports = registrationsDB.model('Deliveryagent', deliveryAgentSchema);