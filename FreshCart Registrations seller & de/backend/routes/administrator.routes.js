const express = require('express');
const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller');
const Deliveryagent = require('../models/Deliveryagent');

const router = express.Router();

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'freshcart_jwt_secret_key_here';

// Middleware to authenticate administrator
const authenticateAdministrator = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'Administrator') {
      return res.status(403).json({ message: 'Access denied. Administrators only.' });
    }

    // Note: In a production environment, you might want to verify the administrator exists
    req.administrator = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get approved sellers
router.get('/sellers/approved', authenticateAdministrator, async (req, res) => {
  try {
    const approvedSellers = await Seller.find({ status: 'approved' })
      .select('sellerName contactPersonName phoneNumber email businessType storeName businessRegistrationNumberOrGST fssaiLicenseNumber operatingHours storeAddress pinCode deliveryMethod bankAccountHolderName bankAccountNumber ifscCode upiId panNumber productCategories status idProofStatus gstDocumentStatus fssaiLicenseStatus approvedAt isConfirmed');

    res.status(200).json(approvedSellers);
  } catch (error) {
    console.error('Get approved sellers error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Confirm seller registration and create account in Users DB
router.patch('/sellers/:id/confirm', authenticateAdministrator, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the seller in Registrations DB
    const registrationSeller = await Seller.findById(id);
    if (!registrationSeller) {
      return res.status(404).json({ message: 'Seller registration not found' });
    }

    if (registrationSeller.isConfirmed) {
      return res.status(400).json({ message: 'Seller is already confirmed and account created.' });
    }

    // 2. Create entry in Users DB (Seller collection)
    const UserSeller = require('../models/UserSeller');

    // Check if user already exists in Users DB to avoid duplicates
    const existingUser = await UserSeller.findOne({ email: registrationSeller.email });
    if (existingUser) {
      // Even if exists, we verify the registration. 
      // But strictly speaking, if email is unique, we might skip creation or update.
      // For now, if exists, we assume it's done or handle error? 
      // Let's assume we proceed to update registration status but warn or skip creation.
      // However, the requirement is "create seller account".
      console.log('User already exists in Users DB:', registrationSeller.email);
    } else {
      const newUserSeller = new UserSeller({
        sellerName: registrationSeller.sellerName,
        contactPersonName: registrationSeller.contactPersonName,
        phoneNumber: registrationSeller.phoneNumber,
        email: registrationSeller.email,
        passwordHash: registrationSeller.passwordHash,
        businessType: registrationSeller.businessType,
        storeName: registrationSeller.storeName,
        businessRegistrationNumberOrGST: registrationSeller.businessRegistrationNumberOrGST,
        fssaiLicenseNumber: registrationSeller.fssaiLicenseNumber,
        operatingHours: registrationSeller.operatingHours,
        storeAddress: registrationSeller.storeAddress,
        pinCode: registrationSeller.pinCode,
        deliveryMethod: registrationSeller.deliveryMethod,
        bankAccountHolderName: registrationSeller.bankAccountHolderName,
        bankAccountNumber: registrationSeller.bankAccountNumber,
        ifscCode: registrationSeller.ifscCode,
        upiId: registrationSeller.upiId,
        panNumber: registrationSeller.panNumber,
        productCategories: registrationSeller.productCategories,
        status: 'active', // Set as active in Users DB
        idProofStatus: registrationSeller.idProofStatus,
        gstDocumentStatus: registrationSeller.gstDocumentStatus,
        fssaiLicenseStatus: registrationSeller.fssaiLicenseStatus
      });
      await newUserSeller.save();
    }

    // 3. Update Registration DB status
    const updatedRegistration = await Seller.findByIdAndUpdate(
      id,
      {
        isConfirmed: true,
        confirmedAt: new Date(),
        confirmedBy: req.administrator.id
      },
      { new: true }
    ).select('storeName email phoneNumber categoryOfProducts isConfirmed confirmedAt');

    res.status(200).json({
      message: 'Seller account created and registration confirmed successfully',
      seller: updatedRegistration
    });
  } catch (error) {
    console.error('Confirm seller error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Export approved sellers as CSV
router.get('/sellers/export', authenticateAdministrator, async (req, res) => {
  try {
    const sellers = await Seller.find({ status: 'approved' });

    // Create CSV header
    let csv = 'Store Name,Email,Phone Number,Category,City,Approved Date,Confirmed\n';

    // Add data rows
    sellers.forEach(seller => {
      csv += `"${seller.storeName}","${seller.email}","${seller.phoneNumber}","${seller.categoryOfProducts}","${seller.city}","${seller.approvedAt}","${seller.isConfirmed ? 'Yes' : 'No'}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('approved_sellers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export sellers error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Get approved delivery agents
router.get('/delivery-agents/approved', authenticateAdministrator, async (req, res) => {
  try {
    const approvedDeliveryAgents = await Deliveryagent.find({ status: 'approved' })
      .select('fullName dateOfBirth contactNumber email residentialAddress pinCode vehicleRegistrationNumber bankAccountNumber ifscCode upiId accountHolderName status approvedAt isConfirmed');

    res.status(200).json(approvedDeliveryAgents);
  } catch (error) {
    console.error('Get approved delivery agents error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Confirm delivery agent registration and create account in Users DB
router.patch('/delivery-agents/:id/confirm', authenticateAdministrator, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the agent in Registrations DB
    const registrationAgent = await Deliveryagent.findById(id);
    if (!registrationAgent) {
      return res.status(404).json({ message: 'Delivery agent registration not found' });
    }

    if (registrationAgent.isConfirmed) {
      return res.status(400).json({ message: 'Delivery agent is already confirmed and account created.' });
    }

    // 2. Create entry in Users DB (Deliveryagent collection)
    const UserDeliveryAgent = require('../models/UserDeliveryAgent');

    // Check if user already exists
    const existingUser = await UserDeliveryAgent.findOne({ email: registrationAgent.email });
    if (existingUser) {
      console.log('User already exists in Users DB:', registrationAgent.email);
    } else {
      const newUserDeliveryAgent = new UserDeliveryAgent({
        fullName: registrationAgent.fullName,
        passwordHash: registrationAgent.passwordHash,
        dateOfBirth: registrationAgent.dateOfBirth,
        contactNumber: registrationAgent.contactNumber,
        email: registrationAgent.email,
        residentialAddress: registrationAgent.residentialAddress,
        pinCode: registrationAgent.pinCode,
        vehicleRegistrationNumber: registrationAgent.vehicleRegistrationNumber,
        bankAccountNumber: registrationAgent.bankAccountNumber,
        ifscCode: registrationAgent.ifscCode,
        upiId: registrationAgent.upiId,
        accountHolderName: registrationAgent.accountHolderName,
        status: 'active' // Set as active in Users DB
      });
      await newUserDeliveryAgent.save();
    }

    // 3. Update Registration DB status
    const updatedRegistration = await Deliveryagent.findByIdAndUpdate(
      id,
      {
        isConfirmed: true,
        confirmedAt: new Date(),
        confirmedBy: req.administrator.id
      },
      { new: true }
    ).select('fullName email contactNumber city isConfirmed confirmedAt');

    res.status(200).json({
      message: 'Delivery agent account created and registration confirmed successfully',
      deliveryAgent: updatedRegistration
    });
  } catch (error) {
    console.error('Confirm delivery agent error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Export approved delivery agents as CSV
router.get('/delivery-agents/export', authenticateAdministrator, async (req, res) => {
  try {
    const deliveryAgents = await Deliveryagent.find({ status: 'approved' });

    // Create CSV header
    let csv = 'Full Name,Email,Contact Number,City,Approved Date,Confirmed\n';

    // Add data rows
    deliveryAgents.forEach(agent => {
      csv += `"${agent.fullName}","${agent.email}","${agent.contactNumber}","${agent.city}","${agent.approvedAt}","${agent.isConfirmed ? 'Yes' : 'No'}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('approved_delivery_agents.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export delivery agents error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

module.exports = router;