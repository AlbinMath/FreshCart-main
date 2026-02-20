const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Create Review
router.post('/create', async (req, res) => {
    try {
        const {
            userId,
            orderId,
            productRate,
            qualityRate,
            deliveryRate,
            overallRate,
            likeFeatures,
            reviewText,
            suggestion,
            deliveryReview
        } = req.body;

        if (!userId || !orderId || !deliveryRate || !overallRate || !reviewText) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check if review already exists for this order
        const existingReview = await Review.findOne({ orderId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "Review already submitted for this order" });
        }

        const newReview = new Review({
            userId,
            orderId,
            productRate,
            qualityRate,
            deliveryRate,
            overallRate,
            likeFeatures,
            reviewText,
            suggestion,
            deliveryReview
        });

        await newReview.save();

        res.json({ success: true, message: "Review submitted successfully", review: newReview });
    } catch (error) {
        console.error("Error creating review:", error);
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

        const review = await Review.findOneAndUpdate(
            { orderId },
            { $set: updates },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.json({ success: true, message: "Review updated successfully", review });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get Reviews by User (Optional, useful later)
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
