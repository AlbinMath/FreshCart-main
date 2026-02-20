const router = require('express').Router();
const Review = require('../models/Review');

// Get reviews for a specific product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.json(reviews);
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
        const reviews = await Review.find({ productId });

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
