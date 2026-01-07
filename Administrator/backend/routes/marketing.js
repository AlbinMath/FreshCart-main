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
        const coupons = await Coupon.find().sort({ createdAt: -1 });
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
        const flashSales = await FlashSale.find()
            .sort({ createdAt: -1 });
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


// --- Bundles ---

// Create Bundle
router.post('/bundles', async (req, res) => {
    try {
        const bundle = new Bundle(req.body);
        await bundle.save();
        res.status(201).json(bundle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Bundles
router.get('/bundles', async (req, res) => {
    try {
        const bundles = await Bundle.find()
            .populate('products.productId', 'name images price')
            .sort({ createdAt: -1 });
        res.json(bundles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Bundle
router.delete('/bundles/:id', async (req, res) => {
    try {
        await Bundle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Bundle deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
