const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/products', async (req, res) => {
    try {
        console.log('Fetching products...');
        const products = await Product.find({
            status: { $nin: ['inactive', 'forced-inactive', 'Forced Inactive', 'Inactive'] }
        });
        console.log(`Found ${products.length} products`);
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
