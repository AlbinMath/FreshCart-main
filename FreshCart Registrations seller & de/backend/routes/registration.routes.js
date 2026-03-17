const express = require('express');
const Seller = require('../models/Seller');
const Deliveryagent = require('../models/Deliveryagent');

const router = express.Router();
// Get registration status by ID and Email
router.get('/status', async (req, res) => {
  try {
    const { id, email } = req.query;

    if (!id && !email) {
      return res.status(400).json({
        message: 'Please provide either Registration ID or Email'
      });
    }

    // Helper to check validity of ID string if it's MongoDB ObjectId (24 hex chars)
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // Build search criteria
    const searchCriteria = [];
    if (id && isValidObjectId(id)) searchCriteria.push({ _id: id });
    if (email) searchCriteria.push({ email: email });

    if (searchCriteria.length === 0) {
      return res.status(400).json({ message: 'Invalid search criteria provided' });
    }

    // Attempt to find in Seller collection
    let registration = await Seller.findOne({ $or: searchCriteria });
    let type = 'seller';

    if (!registration) {
      // Search Delivery Agent
      registration = await Deliveryagent.findOne({ $or: searchCriteria });
      type = 'deliveryAgent';
    }

    if (registration) {
      return res.status(200).json({
        accountType: type,
        status: registration.status,
        statusReason: registration.statusReason,
        name: type === 'seller' ? registration.sellerName : registration.fullName,
        email: registration.email,
        submittedDate: registration.createdAt,
        reviewedDate: registration.updatedAt
      });
    }

    // If not found
    return res.status(404).json({
      message: 'No registration found matching the provided ID or Email'
    });

  } catch (error) {
    console.error('Registration status check error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});


// Create new seller registration
router.post('/seller', async (req, res) => {
  try {
    const {
      sellerName, contactPerson, phone, email, password,
      businessType, storeName, gstNumber, fssaiLicense,
      productCategory, openingTime, closingTime,
      address, pinCode, serviceRadius, deliveryMethod,
      accountHolder, accountNumber, ifscCode, upiId, panNumber,
      packagingProcess, storageDetails,
      idProof, gst, ownership, bankProof, photo, shopPhoto, fssai
    } = req.body;

    // Check if seller already exists (by phone or email)
    const existingSeller = await Seller.findOne({
      $or: [{ phoneNumber: phone }, { email: email }]
    });

    if (existingSeller) {
      return res.status(400).json({
        message: 'Seller with this phone number or email already exists'
      });
    }

    // Hash password (using bcryptjs found in package.json)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new seller
    const newSeller = new Seller({
      sellerName,
      contactPersonName: contactPerson,
      phoneNumber: phone,
      email,
      passwordHash,
      businessType,
      storeName,
      businessRegistrationNumberOrGST: gstNumber,
      fssaiLicenseNumber: fssaiLicense,
      fssaiLicenseUrl: fssai,
      // Handle productCategory which might be array or string. Frontend sends array?
      // Model expects simple fields, let's map loosely matching model schema
      productCategories: Array.isArray(productCategory) ? productCategory : [productCategory],
      operatingHours: `${openingTime} - ${closingTime}`,
      storeAddress: address,
      pinCode,
      // Service radius was removed from frontend, but model has it. Ignore or set default?
      // Frontend disabled it but model doesn't enforce required (unless 'required: true' which verified previously lines 70-72 showed type String, not required)

      deliveryMethod: deliveryMethod === 'self' ? 'Seller delivery' : 'Platform delivery',

      bankAccountHolderName: accountHolder,
      bankAccountNumber: accountNumber,
      ifscCode,
      upiId,
      panNumber,

      packagingProcessDetails: packagingProcess,
      storageRefrigerationDetails: storageDetails,

      // Document URLs
      idProofUrl: idProof,
      gstDocumentUrl: gst,
      ownershipProofUrl: ownership,
      bankAccountProofUrl: bankProof,
      shopPhotoUrl: shopPhoto,
      tradeLicenseUrl: null, // Not in frontend mandatory list?

      status: 'pending' // Default
    });

    await newSeller.save();

    res.status(201).json({
      message: 'Seller registration successful',
      registrationId: newSeller._id
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation failed',
        error: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate field value entered',
        error: 'Email or Phone number already exists'
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
    });
  }
});

// Create new delivery agent registration
router.post('/delivery-agent', async (req, res) => {
  try {
    const {
      fullName, dateOfBirth, phone, email, password,
      address, city, pinCode,
      vehicleType, registrationNumber,
      accountHolder, accountNumber, ifscCode, upiId,
      aadhaar, voterId, photo, addressProof, panCard,
      rcBook, drivingLicense, vehicleInsurance, vehiclePhoto, bankStatement
    } = req.body;

    // Check if delivery agent already exists (by phone or email)
    const existingAgent = await Deliveryagent.findOne({
      $or: [{ contactNumber: phone }, { email: email }]
    });

    if (existingAgent) {
      return res.status(400).json({
        message: 'Delivery Agent with this phone number or email already exists'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new delivery agent
    const newAgent = new Deliveryagent({
      fullName,
      dateOfBirth,
      contactNumber: phone,
      email,
      passwordHash,

      residentialAddress: address,
      city,
      pinCode,

      // Identity Proofs
      identityProofType: aadhaar ? 'Aadhaar' : 'Voter ID',
      identityProofUrl: aadhaar || voterId,
      photoUrl: photo,
      panCardUrl: panCard,

      // Vehicle Details
      vehicleType,
      vehicleRegistrationNumber: registrationNumber,
      rcBookUrl: rcBook,
      drivingLicenseUrl: drivingLicense,
      insuranceDetails: vehicleInsurance, // Using insuranceDetails field for the URL/File

      // Additional vehicle photo stored ? Model doesn't have explicit vehiclePhotoUrl but let's check
      // Model has: vehicleType, vehicleRegistrationNumber, rcBookUrl, drivingLicenseUrl, insuranceDetails, vehicleFuelType
      // It doesn't seem to have a specific vehiclePhotoUrl. 
      // I will skip saving vehiclePhoto for now or map it to a generic field if available, 
      // but to be safe and avoid schema errors, I'll omit it if not in schema.
      // CHECKING SCHEMA AGAIN: 
      // Fields: vehicleType, vehicleRegistrationNumber, rcBookUrl, drivingLicenseUrl, insuranceDetails, vehicleFuelType.
      // No vehiclePhotoUrl. I will omit it to prevent error.

      // Bank Details
      bankAccountNumber: accountNumber,
      ifscCode,
      upiId,
      accountHolderName: accountHolder,

      status: 'pending'
    });

    await newAgent.save();

    res.status(201).json({
      message: 'Delivery Agent registration successful',
      registrationId: newAgent._id
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation failed',
        error: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate field value entered',
        error: 'Email or Phone number already exists'
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
    });
  }
});

module.exports = router;