const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');

// Connect to the shared Products DB to read Admin-created Flash Sales
const { productsConn } = require('../config/db');
const flashSaleSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: false },
    title: { type: String, required: true },
    description: { type: String },
    bannerImage: { type: String },
    status: { type: String, enum: ['Draft', 'Active', 'Paused', 'Ended'], default: 'Draft' },
    priority: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: 'IST' },
    autoActivate: { type: Boolean, default: true },
    autoExpire: { type: Boolean, default: true },
    salesTarget: { type: Number },
    saleTag: { type: String },
    approvalRequired: { type: Boolean, default: false },
    editLock: { type: Boolean, default: false },
    auditLog: { type: Boolean, default: true }
}, { timestamps: true, collection: 'flashsales' });

// Use existing model if already registered to avoid OverwriteModelError
const AdminFlashSale = productsConn.models['FlashSale'] || productsConn.model('FlashSale', flashSaleSchema);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

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
        fs.unlinkSync(req.file.path);

        res.json({ secure_url: result.secure_url });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

// --- Coupons ---

// Create Coupon for Seller
router.post('/coupons', async (req, res) => {
    try {
        const data = req.body;
        if (!data.sellerId) {
            return res.status(400).json({ message: 'Seller ID is required for seller coupons.' });
        }
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

// Get Coupons by Seller ID
router.get('/coupons/:sellerId', async (req, res) => {
    try {
        const coupons = await Coupon.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Coupon
router.delete('/coupons/:id/:sellerId', async (req, res) => {
    try {
        // Ensure it belongs to the seller
        const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, sellerId: req.params.sellerId });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found or unauthorized' });
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Flash Sales (Admin Only) ---

// Get ACTIVE Admin Flash Sales for Seller Enrollment
// Reads from the shared Products database (Registrations > Products > flashsales)
router.get('/admin-flash-sales', async (req, res) => {
    try {
        const now = new Date();
        const activeSales = await AdminFlashSale.find({
            $or: [{ sellerId: null }, { sellerId: { $exists: false } }],
            status: 'Active',
            startTime: { $lte: now },
            endTime: { $gt: now }
        }).sort({ endTime: 1 });

        res.json(activeSales);
    } catch (error) {
        console.error("Error fetching admin flash sales:", error);
        res.status(500).json({ message: error.message });
    }
});

// Enroll Product in Flash Sale
router.post('/enroll-product', async (req, res) => {
    try {
        const { sellerId, productId, flashSaleId, flashSalePrice } = req.body;

        if (!sellerId || !productId || !flashSaleId || !flashSalePrice) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify product belongs to seller
        const product = await Product.findOne({ _id: productId, sellerId: sellerId });
        if (!product) {
            return res.status(404).json({ message: "Product not found or unauthorized" });
        }

        // Update Product
        product.activeFlashSale = flashSaleId;
        product.flashSalePrice = Number(flashSalePrice);
        await product.save();

        res.json({ message: "Product successfully enrolled in Flash Sale", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Un-enroll Product from Flash Sale
router.post('/unenroll-product', async (req, res) => {
    try {
        const { sellerId, productId } = req.body;

        const product = await Product.findOne({ _id: productId, sellerId: sellerId });
        if (!product) {
            return res.status(404).json({ message: "Product not found or unauthorized" });
        }

        // Remove Flash Sale data
        product.activeFlashSale = undefined;
        product.flashSalePrice = undefined;
        await product.save();

        res.json({ message: "Product removed from Flash Sale", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get ALL Admin Flash Sales (including Ended) - for title/status lookup in enrolled table
router.get('/all-admin-flash-sales', async (req, res) => {
    try {
        const allSales = await AdminFlashSale.find({
            $or: [{ sellerId: null }, { sellerId: { $exists: false } }]
        }).sort({ endTime: -1 });
        res.json(allSales);
    } catch (error) {
        console.error("Error fetching all admin flash sales:", error);
        res.status(500).json({ message: error.message });
    }
});

// Update Flash Sale Price for an enrolled product
router.patch('/update-flash-price', async (req, res) => {
    try {
        const { sellerId, productId, flashSalePrice } = req.body;

        if (!sellerId || !productId || !flashSalePrice) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const product = await Product.findOne({ _id: productId, sellerId: sellerId });
        if (!product) {
            return res.status(404).json({ message: "Product not found or unauthorized" });
        }

        if (Number(flashSalePrice) >= product.sellingPrice) {
            return res.status(400).json({ message: "Flash sale price must be lower than the current selling price." });
        }

        product.flashSalePrice = Number(flashSalePrice);
        await product.save();

        res.json({ message: "Flash sale price updated", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

