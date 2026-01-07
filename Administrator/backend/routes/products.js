const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Fetch all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching products' });
    }
});

// PATCH /api/products/:id/status - Update product status (Force Inactive / Active)
router.patch('/:id/status', async (req, res) => {
    const { status, approvalStatus } = req.body;

    try {
        const updateData = {};
        if (status) updateData.status = status;
        if (approvalStatus) updateData.approvalStatus = approvalStatus;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating product status' });
    }
});

module.exports = router;
