const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PaymentDetail = require('../models/PaymentDetail');
const { encrypt, decrypt, maskData } = require('../utils/encryption');

// Create or Update User (Sync from Firebase)
router.post('/sync', async (req, res) => {
    try {
        const { uid, email, name, phoneNumber, role, isVerified } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        let user = await User.findOne({ uid });

        if (user) {
            // Update existing user
            user.name = name || user.name;
            user.phoneNumber = phoneNumber || user.phoneNumber;
            user.role = role || user.role;
            if (isVerified !== undefined) user.isVerified = isVerified;
            await user.save();
            return res.json({ success: true, user, message: 'User updated' });
        } else {
            // Create new user
            user = new User({
                uid,
                email,
                name,
                phoneNumber,
                role: role || 'customer',
                isVerified: isVerified || false
            });
            await user.save();
            return res.status(201).json({ success: true, user, message: 'User created' });
        }
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get User Profile
router.get('/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid }).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch addresses from Customer DB
        const addresses = await Address.find({ uid: req.params.uid });
        user.addresses = addresses;

        // Fetch payment details (masked by default)
        const paymentDetails = await PaymentDetail.find({ uid: req.params.uid });
        user.paymentDetails = paymentDetails.map(pd => {
            const decryptedDetails = JSON.parse(decrypt(pd.details, pd.iv));
            const masked = {};
            for (const key in decryptedDetails) {
                masked[key] = maskData(decryptedDetails[key]);
            }
            return {
                _id: pd._id,
                type: pd.type,
                details: masked,
                isDefault: pd.isDefault,
                createdAt: pd.createdAt
            };
        });

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add or Update Payment Detail
router.post('/payment-detail', async (req, res) => {
    try {
        const { uid, type, details, isDefault } = req.body;
        
        if (!uid || !type || !details) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Encrypt the details
        const detailsString = JSON.stringify(details);
        const { encryptedData, iv } = encrypt(detailsString);

        if (isDefault) {
            await PaymentDetail.updateMany({ uid }, { $set: { isDefault: false } });
        }

        const newPaymentDetail = new PaymentDetail({
            uid,
            type,
            details: encryptedData,
            iv,
            isDefault: !!isDefault
        });

        await newPaymentDetail.save();

        res.json({ 
            success: true, 
            message: 'Payment detail added successfully',
            paymentDetail: {
                _id: newPaymentDetail._id,
                type: newPaymentDetail.type,
                isDefault: newPaymentDetail.isDefault
            }
        });
    } catch (error) {
        console.error('Error adding payment detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Decrypted Payment Detail (Security required in production, here we provide it for the requested "Show" feature)
router.get('/payment-detail/reveal/:id', async (req, res) => {
    try {
        const { uid } = req.query;
        const pd = await PaymentDetail.findById(req.params.id);

        if (!pd) return res.status(404).json({ success: false, message: 'Not found' });
        if (pd.uid !== uid) return res.status(403).json({ success: false, message: 'Unauthorized' });

        const decryptedDetails = JSON.parse(decrypt(pd.details, pd.iv));
        
        res.json({ success: true, details: decryptedDetails });
    } catch (error) {
        console.error('Error revealing payment detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Payment Detail
router.delete('/payment-detail/:id', async (req, res) => {
    try {
        const { uid } = req.query;
        const pd = await PaymentDetail.findById(req.params.id);

        if (!pd) return res.status(404).json({ success: false, message: 'Not found' });
        if (pd.uid !== uid) return res.status(403).json({ success: false, message: 'Unauthorized' });

        await PaymentDetail.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Payment detail deleted' });
    } catch (error) {
        console.error('Error deleting payment detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add Address (stores in Customer DB)
const Address = require('../models/Address');
router.post('/address', async (req, res) => {
    try {
        const { uid, address } = req.body;
        // Ensure user exists
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // If new address is default, unset other defaults for this user
        if (address.isDefault) {
            await Address.updateMany({ uid, isDefault: true }, { $set: { isDefault: false } });
        }
        // Create new address document
        const newAddress = new Address({ uid, ...address });
        await newAddress.save();
        res.json({ success: true, address: newAddress, message: 'Address added' });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Address
router.delete('/address/:id', async (req, res) => {
    try {
        const addressId = req.params.id;
        const uid = req.query.uid; // Pass uid in query to verify ownership

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        if (address.uid !== uid) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (address.isDefault) {
            return res.status(400).json({ success: false, message: 'Cannot delete default address' });
        }

        await Address.findByIdAndDelete(addressId);
        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Set Default Address
router.put('/address/set-default', async (req, res) => {
    try {
        const { uid, addressId } = req.body;

        if (!uid || !addressId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Unset existing default
        await Address.updateMany({ uid }, { $set: { isDefault: false } });

        // 2. Set new default
        const address = await Address.findByIdAndUpdate(addressId, { isDefault: true }, { new: true });

        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        res.json({ success: true, message: 'Default address updated' });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Address
router.put('/address/:id', async (req, res) => {
    try {
        const { uid, address } = req.body;
        const addressId = req.params.id;

        const existingAddress = await Address.findById(addressId);
        if (!existingAddress) return res.status(404).json({ success: false, message: 'Address not found' });
        if (existingAddress.uid !== uid) return res.status(403).json({ success: false, message: 'Unauthorized' });

        if (address.isDefault) {
            await Address.updateMany({ uid, isDefault: true }, { $set: { isDefault: false } });
        }

        const updatedAddress = await Address.findByIdAndUpdate(addressId, address, { new: true });
        res.json({ success: true, address: updatedAddress, message: 'Address updated' }); // Fix: Return updated address

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Geolocation Proxy (to avoid CORS)
const axios = require('axios');

router.get('/geolocation/reverse', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': 'FreshCart-App/1.0' }
        });
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Geo reverse error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch location details' });
    }
});

router.get('/geolocation/search', async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
            headers: { 'User-Agent': 'FreshCart-App/1.0' }
        });
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Geo search error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coordinates' });
    }
});

module.exports = router;
