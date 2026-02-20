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

// Get single product by ID
router.get('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        console.log('Fetching product with ID:', productId);

        // Validate productId format (MongoDB ObjectId)
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if product is active
        if (['inactive', 'forced-inactive', 'Forced Inactive', 'Inactive'].includes(product.status)) {
            return res.status(404).json({ success: false, message: 'Product not available' });
        }

        console.log('Product found:', product.productName);
        res.json({ success: true, product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
