const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/products', async (req, res) => {
    try {
        console.log('Fetching products with ratings...');
        // We use aggregation to join with the Reviews collection
        const products = await Product.aggregate([
            {
                $match: {
                    status: { $nin: ['inactive', 'forced-inactive', 'Forced Inactive', 'Inactive'] }
                }
            },
            {
                $addFields: {
                    productIdString: { $toString: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "Reviews",
                    localField: "productIdString",
                    foreignField: "productId",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: "$reviews" },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.overallRate" },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    reviews: 0,
                    productIdString: 0
                }
            }
        ]);

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

        const mongoose = require('mongoose');
        const productStats = await Product.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(productId) }
            },
            {
                $addFields: {
                    productIdString: { $toString: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "Reviews",
                    localField: "productIdString",
                    foreignField: "productId",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: "$reviews" },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.overallRate" },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    reviews: 0,
                    productIdString: 0
                }
            }
        ]);

        if (!productStats || productStats.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = productStats[0];

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
