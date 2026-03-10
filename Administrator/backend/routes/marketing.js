const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const FlashSale = require('../models/FlashSale');
const Bundle = require('../models/Bundle');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- Upload Route ---
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'freshcart_uploads',
            use_filename: true
        });
        // Remove temp file
        fs.unlinkSync(req.file.path);

        res.json({ secure_url: result.secure_url });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

// --- Coupons ---

// Create Coupon
router.post('/coupons', async (req, res) => {
    try {
        const data = req.body;
        // Process keywords if they are a string
        if (typeof data.keywords === 'string') {
            data.keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
        }
        const coupon = new Coupon(data);
        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Coupons
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find({
            $or: [{ sellerId: null }, { sellerId: { $exists: false } }]
        }).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Coupon
router.delete('/coupons/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Flash Sales ---

// Create Flash Sale
router.post('/flash-sales', async (req, res) => {
    try {
        const { startTime, endTime } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: 'startTime and endTime are required.' });
        }

        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);

        if (newStart >= newEnd) {
            return res.status(400).json({ message: 'Start time must be before end time.' });
        }

        // Check for overlapping flash sales (Active or Draft that would be active)
        const conflict = await FlashSale.findOne({
            $or: [{ sellerId: null }, { sellerId: { $exists: false } }],
            status: { $in: ['Active', 'Draft'] },
            startTime: { $lt: newEnd },
            endTime: { $gt: newStart }
        });

        if (conflict) {
            return res.status(409).json({
                message: `A flash sale "${conflict.title}" already runs from ${new Date(conflict.startTime).toLocaleString()} to ${new Date(conflict.endTime).toLocaleString()}. Please choose a different time window.`,
                conflictingSale: { id: conflict._id, title: conflict.title, startTime: conflict.startTime, endTime: conflict.endTime }
            });
        }

        const flashSale = new FlashSale(req.body);
        await flashSale.save();
        res.status(201).json(flashSale);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Flash Sales
router.get('/flash-sales', async (req, res) => {
    try {
        const flashSales = await FlashSale.find({
            $or: [{ sellerId: null }, { sellerId: { $exists: false } }]
        }).sort({ createdAt: -1 });
        res.json(flashSales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Flash Sale
router.delete('/flash-sales/:id', async (req, res) => {
    try {
        await FlashSale.findByIdAndDelete(req.params.id);
        res.json({ message: 'Flash Sale deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Patch Flash Sale Status (manual override)
router.patch('/flash-sales/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await FlashSale.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Flash Sale not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Auto-update flash sale statuses based on current time
async function autoUpdateFlashSaleStatuses() {
    try {
        const now = new Date();

        // Draft → Active: startTime has passed, endTime hasn't, autoActivate is true
        await FlashSale.updateMany(
            {
                status: 'Draft',
                autoActivate: true,
                startTime: { $lte: now },
                endTime: { $gt: now }
            },
            { $set: { status: 'Active' } }
        );

        // Find sales that are about to be marked Ended (still Active/Draft but expired)
        // We need their IDs BEFORE marking them ended, to clear product fields
        const expiredSales = await FlashSale.find(
            {
                status: { $in: ['Active', 'Draft'] },
                autoExpire: true,
                endTime: { $lte: now }
            },
            { _id: 1 }
        );

        if (expiredSales.length > 0) {
            const expiredIds = expiredSales.map(s => s._id);

            // Mark the sales as Ended
            await FlashSale.updateMany(
                { _id: { $in: expiredIds } },
                { $set: { status: 'Ended' } }
            );

            // Clear activeFlashSale and flashSalePrice from all products enrolled in ended sales
            const updateResult = await Product.updateMany(
                { activeFlashSale: { $in: expiredIds } },
                { $unset: { activeFlashSale: '', flashSalePrice: '' } }
            );

            if (updateResult.modifiedCount > 0) {
                console.log(`[Flash Sale Scheduler] Cleared flash sale pricing from ${updateResult.modifiedCount} product(s) for ${expiredIds.length} ended sale(s).`);
            }
        }

        // Also handle any remaining active/draft that expired but weren't caught above
        await FlashSale.updateMany(
            {
                status: { $in: ['Active', 'Draft'] },
                autoExpire: true,
                endTime: { $lte: now }
            },
            { $set: { status: 'Ended' } }
        );

    } catch (err) {
        console.error('[Flash Sale Scheduler] Error updating statuses:', err.message);
    }
}

module.exports = router;
module.exports.autoUpdateFlashSaleStatuses = autoUpdateFlashSaleStatuses;
