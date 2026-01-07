const express = require('express');
const router = express.Router();
const User = require('../models/User');

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

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
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

module.exports = router;
