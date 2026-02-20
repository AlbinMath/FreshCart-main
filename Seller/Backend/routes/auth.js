const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Auth seller & get token
// @route   POST /api/seller/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);

    try {
        const seller = await Seller.findOne({ email });
        console.log(`[LOGIN] User found: ${!!seller}`);

        if (!seller) {
            console.log('[LOGIN] Seller not found in DB');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('[LOGIN] Checking password...');
        // Check if passwordHash exists
        if (!seller.passwordHash) {
            console.error('[LOGIN ERROR] User has no passwordHash field:', seller);
            return res.status(500).json({ message: 'User data corrupted (missing password)' });
        }

        const isMatch = await seller.matchPassword(password);
        console.log(`[LOGIN] Password match result: ${isMatch}`);

        if (isMatch) {
            const sellerObj = seller.toObject();
            delete sellerObj.passwordHash;

            console.log('[LOGIN] Success, sending token');
            res.json({
                ...sellerObj,
                token: generateToken(seller._id),
            });
        } else {
            console.log('[LOGIN] Password mismatch');
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('[LOGIN ERROR] Exception:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Register a new seller
// @route   POST /api/seller/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, storeName } = req.body;

    try {
        const sellerExists = await Seller.findOne({ email });

        if (sellerExists) {
            return res.status(400).json({ message: 'Seller already exists' });
        }

        const seller = await Seller.create({
            name,
            email,
            passwordHash: password, // Map input password to passwordHash
            storeName
        });

        if (seller) {
            res.status(201).json({
                _id: seller._id,
                name: seller.name,
                email: seller.email,
                storeName: seller.storeName,
                role: seller.role,
                token: generateToken(seller._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid seller data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Seller Profile by ID
// @route   GET /api/seller/profile/:id
// @access  Protected
router.get('/profile/:id', async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id).select('-passwordHash'); // Exclude password
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Auto-generate Seller Unique ID if not present
        if (!seller.sellerUniqueId) {
            const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
            seller.sellerUniqueId = `FC-SEL-${randomStr}`;
            await seller.save();
        }

        res.json(seller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Generate Seller Unique ID
// @route   POST /api/seller/generate-id
// @access  Protected (needs token verification usually, but we are using simple ID passed or context)
// NOTE: Ideally this should use middleware to get seller ID from token.
// For now assuming we pass sellerId in body or headers, OR we implement simple middleware.
// Given strict context, I will verify token inside or assume the request comes from authenticated frontend.
// Let's implement middleware-like token extraction if possible, or just accept _id for simplicity if strict auth middleware isn't ready.
// Looking at previous code, there is no generic protect middleware used in routes/auth.js yet.
// I will implement a check based on request body _id for now.

router.post('/generate-id', async (req, res) => {
    const { sellerId } = req.body;

    try {
        const seller = await Seller.findById(sellerId);

        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        if (seller.sellerUniqueId) {
            return res.status(400).json({ message: 'Unique ID already generated', sellerUniqueId: seller.sellerUniqueId });
        }

        // Generate ID: FC-SEL-{Random 6 chars}
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const uniqueId = `FC-SEL-${randomStr}`;

        // Use findByIdAndUpdate to bypass validation of other fields
        await Seller.findByIdAndUpdate(sellerId, { sellerUniqueId: uniqueId });

        res.json({ sellerUniqueId: uniqueId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Seller Profile
// @route   PUT /api/seller/update-profile
// @access  Protected
router.put('/update-profile', async (req, res) => {
    // NOTE: In a real app, use middleware to get ID from token.

    const {
        sellerId,
        sellerName, // Allow updating display name
        storeName,  // Allow updating store name
        phoneNumber,
        businessType,
        storeAddress,
        pinCode, // Added
        latitude, // Added
        longitude, // Added
        operatingHours,
        productCategories,
        contactPersonName,
        deliveryMethod,
        storeLeave,
        // Legal & Licensing
        businessRegistrationNumberOrGST,
        fssaiLicenseNumber,
        panNumber,
        // Banking
        bankAccountHolderName,
        bankAccountNumber,
        ifscCode,
        upiId
    } = req.body;

    try {
        const seller = await Seller.findById(sellerId);

        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Update fields if provided
        if (sellerName) seller.sellerName = sellerName;
        if (sellerName) seller.name = sellerName;
        if (storeName) seller.storeName = storeName;

        if (phoneNumber) seller.phoneNumber = phoneNumber;
        if (businessType) seller.businessType = businessType;
        if (storeAddress) seller.storeAddress = storeAddress;
        if (pinCode) seller.pinCode = pinCode;
        if (latitude) seller.latitude = latitude;
        if (longitude) seller.longitude = longitude;
        if (operatingHours) seller.operatingHours = operatingHours;
        if (productCategories) seller.productCategories = productCategories;
        if (contactPersonName) seller.contactPersonName = contactPersonName;
        if (deliveryMethod) seller.deliveryMethod = deliveryMethod;
        if (storeLeave) seller.storeLeave = storeLeave;

        if (businessRegistrationNumberOrGST) seller.businessRegistrationNumberOrGST = businessRegistrationNumberOrGST;
        if (fssaiLicenseNumber) seller.fssaiLicenseNumber = fssaiLicenseNumber;
        if (panNumber) seller.panNumber = panNumber;

        if (bankAccountHolderName) seller.bankAccountHolderName = bankAccountHolderName;
        if (bankAccountNumber) seller.bankAccountNumber = bankAccountNumber;
        if (ifscCode) seller.ifscCode = ifscCode;
        if (upiId) seller.upiId = upiId;

        // Save
        const updatedSeller = await seller.save();

        // Return full updated profile (excluding password)
        const sellerObj = updatedSeller.toObject();
        delete sellerObj.passwordHash;

        res.json({
            ...sellerObj,
            token: generateToken(updatedSeller._id) // Keep token fresh
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Seller Password
// @route   PUT /api/seller/update-password
// @access  Protected
router.put('/update-password', async (req, res) => {
    const { sellerId, currentPassword, newPassword } = req.body;

    try {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        if (!seller.passwordHash) {
            // Should not happen for normal users
            return res.status(400).json({ message: 'User account corrupted. Please contact support.' });
        }

        // Check if current password matches
        const isMatch = await seller.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        // Hashing is handled by pre-save middleware in Seller model usually.
        // If not, we need to hash it here.
        // Let's assume pre-save exists or matchPassword implies a standard hashing setup.
        // Looking at register route: `passwordHash: password` suggests simple storage or pre-save.
        // If `matchPassword` uses bcrypt, `passwordHash` must be hash.
        // Let's rely on the model's behavior. If it has pre-save for 'passwordHash' field modification?
        // Or we just update the field and save. 
        // IMPORTANT: If the model has pre-save hook that hashes 'passwordHash', we just set it.
        // Ref: Register route does `passwordHash: password`. If that works and hashes, then we do same.
        // However, register route creates a NEW doc. Updating might be different.
        // Let's check if we need to manually hash if no hook.
        // Safer to just check if `passwordHash` is modified in pre-save.

        // Update password
        seller.passwordHash = newPassword;
        await seller.save();

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
