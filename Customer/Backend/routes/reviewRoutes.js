const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Create Review
router.post('/create', async (req, res) => {
    try {
        const {
            userId,
            orderId,
            productId,
            productRate,
            qualityRate,
            deliveryRate,
            overallRate,
            likeFeatures,
            reviewText,
            suggestion,
            deliveryReview,
            productName,
            productImage,
            productCategory
        } = req.body;

        const missing = [];
        if (!userId) missing.push('userId');
        if (!orderId) missing.push('orderId');
        if (!productId) missing.push('productId');
        if (!deliveryRate) missing.push('deliveryRate');
        if (!overallRate) missing.push('overallRate');
        if (!reviewText) missing.push('reviewText');

        if (missing.length > 0) {
            return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
        }

        // Check if review already exists for this product in this order
        const existingReview = await Review.findOne({ orderId, productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "Review already submitted for this product" });
        }

        const newReview = new Review({
            userId,
            orderId,
            productId,
            productRate,
            qualityRate,
            deliveryRate,
            overallRate,
            likeFeatures,
            reviewText,
            suggestion,
            deliveryReview,
            productName,
            productImage,
            productCategory
        });

        await newReview.save();

        res.json({ success: true, message: "Review submitted successfully", review: newReview });
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get Review by Order ID and Product ID
router.get('/order/:orderId/product/:productId', async (req, res) => {
    try {
        const review = await Review.findOne({
            orderId: req.params.orderId,
            productId: req.params.productId
        });
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        res.json({ success: true, review });
    } catch (error) {
        console.error("Error fetching review:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get Review by Order ID
router.get('/order/:orderId', async (req, res) => {
    try {
        const review = await Review.findOne({ orderId: req.params.orderId });
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Auto-Backfill: If missing product info, try to fetch it
        if (!review.productName || !review.productImage) {
            const order = await Order.findById(review.orderId).catch(() => null) || 
                          await Order.findOne({ orderId: review.orderId }).catch(() => null);
            
            if (order && order.items && order.items.length > 0) {
                // If it was ORDER_LEVEL, associate with first product
                if (review.productId === 'ORDER_LEVEL') {
                    review.productId = order.items[0].productId || order.items[0]._id;
                }
                
                // Fetch product details
                const product = await Product.findById(review.productId).catch(() => null);
                if (product) {
                    review.productName = product.productName;
                    review.productImage = product.images?.[0];
                    review.productCategory = product.category;
                    await review.save();
                } else {
                    // Fallback to order item details
                    const item = order.items.find(i => (i.productId || i._id).toString() === review.productId.toString()) || order.items[0];
                    review.productName = item.productName;
                    review.productImage = item.image || (item.images && item.images[0]);
                    await review.save();
                }
            }
        }

        res.json({ success: true, review });
    } catch (error) {
        console.error("Error fetching review:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Update Review
router.put('/update/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const updates = req.body;

        // Remove immutable fields if present in body to be safe, though not strictly necessary if we use specific updates
        delete updates.userId;
        delete updates.orderId;
        delete updates._id;

        const query = { orderId };
        if (updates.productId && updates.productId !== 'ORDER_LEVEL') {
            query.productId = updates.productId;
        }

        let review = await Review.findOne(query);

        // Fallback: If not found and searching for specific product, check if there's an ORDER_LEVEL review
        if (!review && query.productId) {
            review = await Review.findOne({ orderId, productId: 'ORDER_LEVEL' });
        }

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Apply updates
        Object.assign(review, updates);
        await review.save();

        res.json({ success: true, message: "Review updated successfully", review });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get Reviews by User (With Auto-Backfill)
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        
        // Backfill for each review if missing info
        for (const review of reviews) {
            if (!review.productName || !review.productImage || review.productId === 'ORDER_LEVEL') {
                const order = await Order.findById(review.orderId).catch(() => null) || 
                              await Order.findOne({ orderId: review.orderId }).catch(() => null);
                
                if (order && order.items && order.items.length > 0) {
                    if (review.productId === 'ORDER_LEVEL') {
                        review.productId = order.items[0].productId || order.items[0]._id;
                    }
                    
                    const product = await Product.findById(review.productId).catch(() => null);
                    if (product) {
                        review.productName = product.productName;
                        review.productImage = product.images?.[0];
                        review.productCategory = product.category;
                        await review.save();
                    } else {
                        const item = order.items.find(i => (i.productId || i._id).toString() === review.productId.toString()) || order.items[0];
                        review.productName = item.productName;
                        review.productImage = item.image || (item.images && item.images[0]);
                        await review.save();
                    }
                }
            }
        }

        res.json({ success: true, reviews });
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        console.error("Error fetching product reviews:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get aggregate rating for a product
router.get('/product-summary/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId });

        if (reviews.length === 0) {
            return res.json({
                success: true,
                summary: {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    aiSummary: "No reviews yet."
                }
            });
        }

        const totalReviews = reviews.length;
        const sumRating = reviews.reduce((acc, rev) => acc + (rev.overallRate || 0), 0);
        const averageRating = (sumRating / totalReviews).toFixed(1);

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(rev => {
            const rate = Math.round(rev.overallRate);
            if (rate >= 1 && rate <= 5) {
                ratingDistribution[rate]++;
            }
        });

        // Call Python Analysis Service
        let aiSummary = "Summary currently unavailable.";
        let aiDetails = null;
        try {
            const pythonUrl = process.env.PYTHON_ANALYSIS_URL || 'http://localhost:6000/analyze-reviews';
            const axios = require('axios');
            
            // Send full review context to Python for a comprehensive summary
            const reviewData = reviews.map(r => ({ 
                reviewText: r.reviewText,
                suggestion: r.suggestion,
                deliveryReview: r.deliveryReview,
                likeFeatures: r.likeFeatures
            }));
            
            console.log(`Sending ${reviewData.length} reviews to Python for full-context analysis...`);
            const pythonRes = await axios.post(pythonUrl, { reviews: reviewData });
            
            if (pythonRes.data.success) {
                aiSummary = pythonRes.data.summary;
                aiDetails = pythonRes.data.details;
                console.log("AI Summary generated successfully.");
            } else {
                console.warn("Python service returned success:false -", pythonRes.data.message);
            }
        } catch (pyErr) {
            console.error("Failed to get AI summary. Connection Error:", pyErr.message);
        }

        res.json({
            success: true,
            summary: {
                averageRating: parseFloat(averageRating),
                totalReviews,
                ratingDistribution,
                aiSummary,
                aiDetails: aiDetails || null
            }
        });
    } catch (error) {
        console.error("Error fetching product summary:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
