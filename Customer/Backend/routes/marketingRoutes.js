const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');

// @desc    Get all currently valid platform-wide coupons (for display in Cart)
// @route   GET /api/marketing/active-coupons
router.get('/active-coupons', async (req, res) => {
    try {
        const today = new Date();
        const currentYear = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const currentMonthDay = `${month}-${day}`;

        // Fetch all active, platform-wide coupons (no sellerId)
        const coupons = await Coupon.find({
            isActive: true,
            startYear: { $lte: currentYear },
            $or: [{ sellerId: null }, { sellerId: { $exists: false } }]
        });

        // Filter by date range validity
        const validCoupons = coupons.filter(coupon => {
            const { validFromDate: from, validToDate: to } = coupon;
            if (from <= to) {
                return currentMonthDay >= from && currentMonthDay <= to;
            } else {
                // Wraps across year boundary (e.g. Dec–Jan)
                return currentMonthDay >= from || currentMonthDay <= to;
            }
        });

        res.json(validCoupons);
    } catch (error) {
        console.error('Error fetching active coupons:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all active Flash Sales
// @route   GET /api/marketing/flash-sales
router.get('/flash-sales', async (req, res) => {
    try {
        const now = new Date();
        const activeSales = await FlashSale.find({
            status: 'Active',
            startTime: { $lte: now },
            endTime: { $gt: now }
        }).sort({ priority: -1, createdAt: -1 });

        res.json(activeSales);
    } catch (error) {
        console.error("Error fetching flash sales:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get products enrolled in a specific flash sale
// @route   GET /api/marketing/flash-sale-products/:saleId
router.get('/flash-sale-products/:saleId', async (req, res) => {
    try {
        const { saleId } = req.params;

        // Validate ObjectId format
        if (!saleId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid sale ID' });
        }

        // Find the sale — allow Active status OR sale whose time is current (handles scheduler lag)
        const now = new Date();
        const sale = await FlashSale.findOne({
            _id: saleId,
            endTime: { $gt: now }   // Sale must not have ended yet
        });

        if (!sale) {
            return res.status(404).json({ message: 'Flash sale not found or has ended' });
        }

        // Find all products enrolled in this sale (by string OR ObjectId match)
        const mongoose = require('mongoose');
        const saleObjectId = new mongoose.Types.ObjectId(saleId);

        const products = await Product.find({
            activeFlashSale: saleObjectId,
            flashSalePrice: { $exists: true, $gt: 0 },
            status: { $nin: ['inactive', 'forced-inactive', 'Inactive', 'Forced Inactive'] }
        });

        res.json({ sale, products });
    } catch (error) {
        console.error("Error fetching flash sale products:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



// @desc    Validate a Coupon Code
// @route   POST /api/marketing/validate-coupon
router.post('/validate-coupon', async (req, res) => {
    try {
        const { code, sellerId, currentTotal } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }

        // Find the coupon (case-insensitive)
        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive coupon code' });
        }

        // If it's a seller-specific coupon, ensure the order contains items from this seller
        // (In a real implementation, you'd check against the actual items in the cart)
        if (coupon.sellerId && sellerId && coupon.sellerId.toString() !== sellerId) {
            return res.status(400).json({ message: 'This coupon is not valid for this store' });
        }

        // Check if within valid recurring dates
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (currentYear < coupon.startYear) {
            return res.status(400).json({ message: `Coupon will be valid starting ${coupon.startYear}` });
        }

        // Date range string comparison (e.g. "12-30" <= "01-05" is false, meaning it wraps around)
        const validFrom = coupon.validFromDate;
        const validTo = coupon.validToDate;

        let isDateValid = false;
        if (validFrom <= validTo) {
            isDateValid = currentMonthDay >= validFrom && currentMonthDay <= validTo;
        } else {
            // Wraps around the year
            isDateValid = currentMonthDay >= validFrom || currentMonthDay <= validTo;
        }

        if (!isDateValid) {
            return res.status(400).json({ message: 'Coupon is not valid at this time of year' });
        }

        // Calculate discount value based on the passed current total
        let discountApplied = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discountApplied = (currentTotal * coupon.discountValue) / 100;
        } else if (coupon.discountType === 'FIXED') {
            discountApplied = coupon.discountValue;
        }

        // Ensure discount doesn't exceed total
        if (discountApplied > currentTotal) {
            discountApplied = currentTotal;
        }

        res.json({
            message: 'Coupon applied successfully',
            discountApplied,
            couponId: coupon._id,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        });

    } catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
