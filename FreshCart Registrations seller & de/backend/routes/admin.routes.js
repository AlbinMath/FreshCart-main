const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Administrator = require('../models/Administrator');
const Seller = require('../models/Seller');
const Deliveryagent = require('../models/Deliveryagent');
const axios = require('axios');

const router = express.Router();

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'freshcart_jwt_secret_key_here';

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get all registrations (Sellers and Delivery Agents)
router.get('/registrations', authenticateAdmin, async (req, res) => {
  try {
    // Get all sellers
    const sellers = await Seller.find()
      .select('sellerName email phoneNumber status createdAt storeName categoryOfProducts productCategories idProofUrl gstDocumentUrl fssaiLicenseUrl tradeLicenseUrl storeAddress businessRegistrationNumberOrGST idProofStatus gstDocumentStatus fssaiLicenseStatus tradeLicenseStatus bankAccountHolderName bankAccountNumber ifscCode upiId');

    // Get all delivery agents
    const deliveryAgents = await Deliveryagent.find()
      .select('fullName email contactNumber status createdAt vehicleType vehicleRegistrationNumber identityProofUrl drivingLicenseUrl rcBookUrl identityProofStatus drivingLicenseStatus rcBookStatus residentialAddress city pinCode bankAccountNumber ifscCode accountHolderName upiId insuranceDetails insuranceDetailsStatus panCardUrl panCardStatus photoUrl photoStatus digitalSignatureUrl digitalSignatureStatus');

    // Format and combine
    const formattedSellers = sellers.map(s => ({
      id: s._id,
      name: s.sellerName, // Use sellerName as main name
      type: 'seller',
      email: s.email,
      phone: s.phoneNumber,
      registrationDate: s.createdAt.toISOString().split('T')[0],
      status: s.status,
      storeName: s.storeName,
      category: Array.isArray(s.productCategories) && s.productCategories.length > 0
        ? s.productCategories.join(', ')
        : s.categoryOfProducts,
      businessAddress: s.storeAddress,
      gstNumber: s.businessRegistrationNumberOrGST,
      // Bank Details
      bankAccountHolderName: s.bankAccountHolderName,
      bankAccountNumber: s.bankAccountNumber,
      ifscCode: s.ifscCode,
      upiId: s.upiId,
      documents: [
        { id: 'doc1', documentType: 'ID Proof', fileName: 'id_proof.jpg', uploadDate: s.createdAt.toISOString().split('T')[0], status: s.idProofStatus || 'pending', url: s.idProofUrl },
        { id: 'doc2', documentType: 'GST Doc', fileName: 'gst.pdf', uploadDate: s.createdAt.toISOString().split('T')[0], status: s.gstDocumentStatus || 'pending', url: s.gstDocumentUrl },
        { id: 'doc3', documentType: 'FSSAI', fileName: 'fssai.pdf', uploadDate: s.createdAt.toISOString().split('T')[0], status: s.fssaiLicenseStatus || 'pending', url: s.fssaiLicenseUrl },
        { id: 'doc4', documentType: 'Trade License', fileName: 'trade.pdf', uploadDate: s.createdAt.toISOString().split('T')[0], status: s.tradeLicenseStatus || 'pending', url: s.tradeLicenseUrl }
      ].filter(d => d.url) // Only show existing docs
    }));

    const formattedAgents = deliveryAgents.map(a => ({
      id: a._id,
      name: a.fullName,
      type: 'delivery',
      email: a.email,
      phone: a.contactNumber,
      registrationDate: a.createdAt.toISOString().split('T')[0],
      status: a.status,
      vehicleType: a.vehicleType,
      vehicleNumber: a.vehicleRegistrationNumber,
      // Personal & Address
      dateOfBirth: a.dateOfBirth ? a.dateOfBirth.toISOString().split('T')[0] : 'N/A',
      address: a.residentialAddress,
      pinCode: a.pinCode,
      // Bank Details
      bankAccountNumber: a.bankAccountNumber,
      ifscCode: a.ifscCode,
      accountHolderName: a.accountHolderName,
      upiId: a.upiId,
      documents: [
        { id: 'doc1', documentType: 'ID Proof', fileName: 'id_proof.jpg', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.identityProofStatus || 'pending', url: a.identityProofUrl },
        { id: 'doc2', documentType: 'License', fileName: 'license.jpg', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.drivingLicenseStatus || 'pending', url: a.drivingLicenseUrl },
        { id: 'doc3', documentType: 'RC Book', fileName: 'rc_book.pdf', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.rcBookStatus || 'pending', url: a.rcBookUrl },
        { id: 'doc4', documentType: 'Agent Photo', fileName: 'photo.jpg', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.photoStatus || 'pending', url: a.photoUrl },
        { id: 'doc5', documentType: 'PAN Card', fileName: 'pan.jpg', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.panCardStatus || 'pending', url: a.panCardUrl },
        { id: 'doc6', documentType: 'Insurance', fileName: 'insurance.pdf', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.insuranceDetailsStatus || 'pending', url: a.insuranceDetails },
        { id: 'doc7', documentType: 'Signature', fileName: 'signature.jpg', uploadDate: a.createdAt.toISOString().split('T')[0], status: a.digitalSignatureStatus || 'pending', url: a.digitalSignatureUrl }
      ].filter(d => d.url)
    }));

    const allUsers = [...formattedSellers, ...formattedAgents];

    res.status(200).json(allUsers);
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Get pending registrations (Legacy - keeping for now just in case)
router.get('/pending-registrations', authenticateAdmin, async (req, res) => {
  try {
    // Get pending sellers
    const pendingSellers = await Seller.find({ status: 'pending' })
      .select('sellerName storeName phoneNumber email categoryOfProducts createdAt');

    // Get pending delivery agents
    const pendingDeliveryAgents = await Deliveryagent.find({ status: 'pending' })
      .select('fullName contactNumber city createdAt');

    res.status(200).json({
      sellers: pendingSellers,
      deliveryAgents: pendingDeliveryAgents
    });
  } catch (error) {
    console.error('Pending registrations error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Get registration details by type and ID
router.get('/registration/:type/:id', authenticateAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;

    let registration = null;

    if (type === 'seller') {
      registration = await Seller.findById(id);
    } else if (type === 'deliveryagent') {
      registration = await Deliveryagent.findById(id);
    } else {
      return res.status(400).json({ message: 'Invalid registration type' });
    }

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json(registration);
  } catch (error) {
    console.error('Registration details error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Update registration status (User status)
router.patch('/registration/:type/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, statusReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    let registration = null;

    if (type === 'seller') {
      registration = await Seller.findByIdAndUpdate(
        id,
        {
          status,
          statusReason,
          approvedAt: new Date(),
          approvedBy: req.admin._id
        },
        { new: true }
      );
    } else if (type === 'deliveryagent') {
      registration = await Deliveryagent.findByIdAndUpdate(
        id,
        {
          status,
          statusReason,
          approvedAt: new Date(),
          approvedBy: req.admin._id
        },
        { new: true }
      );

      // --- IDS Integration: Auto-create Agent Profile ---
      if (status === 'approved' && registration) {
        try {
          const IDS_CORE_API_URL = process.env.IDS_CORE_API_URL || 'http://localhost:2012';
          await axios.post(`${IDS_CORE_API_URL}/api/agents/register`, {
            agent_id: registration._id.toString(),
            name: registration.fullName,
            phone: registration.contactNumber,
            vehicle_type: registration.vehicleType,
            capacity: registration.vehicleType === 'Truck' ? 50 : (registration.vehicleType === 'Car' ? 15 : 5),
            location: {
              longitude: 76.9366, // Default placeholder, delivery app will override
              latitude: 8.5241
            }
          });
          console.log(`[IDS Sync] Auto-created IDS agent profile for ${registration.fullName}`);
        } catch (idsErr) {
          console.error('[IDS Sync Error] Failed to auto-create IDS agent profile:', idsErr.message);
        }
      }
      // --- End IDS Integration ---
    } else {
      return res.status(400).json({ message: 'Invalid registration type' });
    }

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({
      message: `Registration ${status} successfully`,
      registration
    });
  } catch (error) {
    console.error('Update registration status error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Update Document Status
router.patch('/registration/:type/:id/document/:docId/status', authenticateAdmin, async (req, res) => {
  try {
    const { type, id, docId } = req.params;
    const { status } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected' });
    }

    // Map docId to Schema Field
    // Sellers: doc1=idProof, doc2=gst, doc3=fssai, doc4=trade
    // Delivery: doc1=idProof, doc2=license, doc3=rcBook
    let statusField = '';
    let Model = null;

    if (type === 'seller') {
      Model = Seller;
      const map = {
        'doc1': 'idProofStatus',
        'doc2': 'gstDocumentStatus',
        'doc3': 'fssaiLicenseStatus',
        'doc4': 'tradeLicenseStatus'
      };
      statusField = map[docId];
    } else if (type === 'delivery' || type === 'deliveryagent') { // Frontend sends 'delivery', keep consistent
      Model = Deliveryagent;
      const map = {
        'doc1': 'identityProofStatus',
        'doc2': 'drivingLicenseStatus',
        'doc3': 'rcBookStatus',
        'doc4': 'photoStatus',
        'doc5': 'panCardStatus',
        'doc6': 'insuranceDetailsStatus',
        'doc7': 'digitalSignatureStatus'
      };
      statusField = map[docId];
    }

    if (!statusField) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const update = {};
    update[statusField] = status;

    const registration = await Model.findByIdAndUpdate(id, update, { new: true });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({
      message: 'Document status updated',
      registration
    });

  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Get all administrators
router.get('/Administrator', authenticateAdmin, async (req, res) => {
  try {
    const administrators = await Administrator.find()
      .select('name email role createdAt');

    res.status(200).json(administrators);
  } catch (error) {
    console.error('Get administrators error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Create new administrator
router.post('/Administrator', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if administrator already exists
    const existingAdmin = await Administrator.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Administrator with this email already exists' });
    }

    // Create new administrator
    const administrator = new Administrator({
      name,
      email,
      password,
      role: 'Administrator'
    });

    await administrator.save();

    res.status(201).json({
      message: 'Administrator created successfully',
      administrator: {
        id: administrator._id,
        name: administrator.name,
        email: administrator.email,
        role: administrator.role,
        createdAt: administrator.createdAt
      }
    });
  } catch (error) {
    console.error('Create administrator error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Update administrator
router.patch('/Administrator/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove protected fields
    delete updates.role;
    delete updates.password;

    const administrator = await Administrator.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('name email role createdAt');

    if (!administrator) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    res.status(200).json({
      message: 'Administrator updated successfully',
      administrator
    });
  } catch (error) {
    console.error('Update administrator error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Delete administrator
router.delete('/Administrator/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const administrator = await Administrator.findByIdAndDelete(id);

    if (!administrator) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    res.status(200).json({
      message: 'Administrator deleted successfully'
    });
  } catch (error) {
    console.error('Delete administrator error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

module.exports = router;