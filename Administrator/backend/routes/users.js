const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const DeliveryAgent = require('../models/DeliveryAgent');
const Address = require('../models/Address');


// GET /api/users/stats/count
router.get('/stats/count', async (req, res) => {
    try {
        const customerCount = await Customer.countDocuments({});
        const sellerCount = await Seller.countDocuments({});
        const deliveryAgentCount = await DeliveryAgent.countDocuments({});
        // Assuming 'User' model is Administrator from server.js/User.js context
        // We need to import User model if not already (it's not).
        // Let's just sum these for "Total Users" as requested, or maybe fetch Admin count too if possible.
        // User prompt implies specific categories. "Total Users" usually implies ALL users of the platform.
        // I'll check if User model is available. It is not imported in users.js. 
        // I'll import it.

        const User = require('../models/User');
        const adminCount = await User.countDocuments({});

        const totalUsers = customerCount + sellerCount + deliveryAgentCount + adminCount;

        res.json({
            totalUsers,
            customerUsers: customerCount,
            deliveryUsers: deliveryAgentCount,
            sellerUsers: sellerCount
        });
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users/:type
router.get('/:type', async (req, res) => {
    const { type } = req.params;

    try {
        let users = [];
        let model;

        switch (type.toLowerCase()) {
            case 'customer':
                model = Customer;
                break;
            case 'seller':
                model = Seller;
                break;
            case 'deliveryagent':
                model = DeliveryAgent;
                break;
            default:
                return res.status(400).json({ message: 'Invalid user type' });
        }

        if (type.toLowerCase() === 'customer') {
            // Need to join with Address from secondary DB
            const customers = await Customer.find({}).lean();
            const addresses = await Address.find({}).lean();

            console.log(`[DEBUG] Customers count: ${customers.length}`);
            console.log(`[DEBUG] Addresses count: ${addresses.length}`);

            if (customers.length > 0) console.log('[DEBUG] Sample Customer UID:', customers[0].uid);
            if (addresses.length > 0) console.log('[DEBUG] Sample Address UID:', addresses[0].uid);

            users = customers.map(cust => {
                if (!cust.uid) {
                    console.log(`[DEBUG] Customer ${cust.name} has no UID!`);
                    return { ...cust, addressDetails: null };
                }

                // Find all addresses for this customer
                const customerAddresses = addresses.filter(addr => addr.uid === cust.uid);

                // Prioritize default address, otherwise take the first one
                let selectedAddress = customerAddresses.find(addr => addr.isDefault) || customerAddresses[0];

                return {
                    ...cust,
                    addressDetails: selectedAddress || null
                };
            });

            // Log successful matches
            const matchCount = users.filter(u => u.addressDetails).length;
            console.log(`[DEBUG] matched ${matchCount} users with addresses.`);
        } else {
            users = await model.find({});
        }
        res.json(users);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
