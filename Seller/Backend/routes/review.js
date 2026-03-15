const router = require('express').Router();
const Review = require('../models/Review');

// Get reviews for a specific product with pagination
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { productName, page = 1, limit = 5 } = req.query; // Default to 5 per page
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. Initial attempt: Search by productId
        let reviews = await Review.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        
        let totalCount = 0;
        if (reviews.length > 0 || (skip === 0)) {
            totalCount = await Review.countDocuments({ productId });
        }

        // 2. Secondary attempt: Fallback to productName
        if (reviews.length === 0 && productName) {
            reviews = await Review.find({ 
                $or: [
                    { productName: productName },
                    { productName: { $regex: new RegExp("^" + productName + "$", "i") } }
                ]
            }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
            
            totalCount = await Review.countDocuments({ 
                $or: [
                    { productName: productName },
                    { productName: { $regex: new RegExp("^" + productName + "$", "i") } }
                ]
            });
        }
        
        res.json({
            reviews,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: (skip + reviews.length < totalCount)
            }
        });
    } catch (err) {
        console.error("Error fetching product reviews:", err);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
});

// Get reviews for a seller (all products)
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        // This would require joining with products to get seller's products
        // For now, we'll return all reviews (you may need to adjust based on your needs)
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error("Error fetching seller reviews:", err);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
});

// Get review statistics for a product
router.get('/stats/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { productName } = req.query;

        let reviews = await Review.find({ productId });

        // Fallback to name for stats too
        if (reviews.length === 0 && productName) {
            reviews = await Review.find({ 
                $or: [
                    { productName: productName },
                    { productName: { $regex: new RegExp("^" + productName + "$", "i") } }
                ]
            });
        }

        if (reviews.length === 0) {
            return res.json({
                totalReviews: 0,
                averageRating: 0,
                averageProductRate: 0,
                averageQualityRate: 0,
                averageDeliveryRate: 0
            });
        }

        const stats = {
            totalReviews: reviews.length,
            averageRating: (reviews.reduce((sum, r) => sum + r.overallRate, 0) / reviews.length).toFixed(1),
            averageProductRate: (reviews.reduce((sum, r) => sum + r.productRate, 0) / reviews.length).toFixed(1),
            averageQualityRate: (reviews.reduce((sum, r) => sum + r.qualityRate, 0) / reviews.length).toFixed(1),
            averageDeliveryRate: (reviews.reduce((sum, r) => sum + r.deliveryRate, 0) / reviews.length).toFixed(1)
        };

        res.json(stats);
    } catch (err) {
        console.error("Error calculating review stats:", err);
        res.status(500).json({ message: "Failed to calculate stats" });
    }
});

module.exports = router;
