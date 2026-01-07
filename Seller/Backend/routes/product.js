const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary vars are set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("WARNING: Cloudinary environment variables are missing!");
}

// Multer Config (Temp storage)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure 'uploads' directory exists or use /tmp
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
const Seller = require('../models/Seller');

// @desc    Add a new product
// @route   POST /api/products/add
router.post('/add', upload.array('images', 5), async (req, res) => {
    try {
        let {
            // Basic Info
            productName,
            description,
            category,

            // Pricing
            originalPrice,
            sellingPrice,
            discount,

            // Unit/Qty
            quantity,
            unit,
            minimumOrderQuantity,

            // Inventory
            stockQuantity, // Available stock

            // Attributes
            preparationTime,
            cutType,
            meatType,
            freshnessGuarantee,
            storageInstructions,
            shelfLife,

            // Features etc
            features,
            status, // active/draft

            // Seller Info (sellerId usually comes from frontend, or token middleware)
            sellerId,
            sellerName,
            storeName,
            storeAddress,
            sellerUniqueId
        } = req.body;

        // Automatic ID Lookup
        if (!sellerUniqueId && sellerId) {
            try {
                const seller = await Seller.findById(sellerId);
                if (seller && seller.sellerUniqueId) {
                    sellerUniqueId = seller.sellerUniqueId;
                    // Auto-fill other missing details if possible
                    if (!sellerName) sellerName = seller.sellerName || seller.name;
                    if (!storeName) storeName = seller.storeName;
                    if (!storeAddress) storeAddress = seller.storeAddress;
                }
            } catch (err) {
                console.error("Failed to auto-fetch seller details:", err);
            }
        }

        // Basic validation
        if (!sellerUniqueId) {
            return res.status(400).json({ message: 'Seller Unique ID is required and could not be retrieved.' });
        }

        // Default Minimum Order Quantity to Stock Quantity as per requirement
        if (!minimumOrderQuantity && stockQuantity) {
            minimumOrderQuantity = stockQuantity;
        }

        let imageUrls = [];

        // Handle Image Uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'products'
                    });
                    imageUrls.push(result.secure_url);

                    // Remove temp file
                    fs.unlinkSync(file.path);
                } catch (uploadError) {
                    console.error("Cloudinary upload failed for a file:", uploadError);
                }
            }
        }

        // Parse features if stringified (FormData sends objects as strings)
        let parsedFeatures = features;
        if (typeof features === 'string') {
            try {
                parsedFeatures = JSON.parse(features);
            } catch (e) {
                parsedFeatures = [];
            }
        }

        const product = await Product.create({
            productName,
            description,
            category,
            originalPrice,
            sellingPrice,
            discount,
            quantity,
            unit,
            minimumOrderQuantity,
            stockQuantity,
            preparationTime,
            cutType,
            meatType,
            freshnessGuarantee,
            storageInstructions,
            shelfLife,
            features: parsedFeatures,
            images: imageUrls,
            status: status || 'active',
            sellerId,
            sellerName,
            storeName,
            storeAddress,
            sellerUniqueId
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Error adding product:", error);
        // Clean up file if error occurs and file exists
        // Clean up files if error occurs
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get products by Seller Unique ID
// @route   GET /api/products/seller/:sellerUniqueId
router.get('/seller/:sellerUniqueId', async (req, res) => {
    try {
        const products = await Product.find({ sellerUniqueId: req.params.sellerUniqueId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update a product
// @route   PUT /api/products/update/:id
router.put('/update/:id', upload.array('images', 5), async (req, res) => {
    try {
        let {
            productName,
            description,
            category,
            originalPrice,
            sellingPrice,
            discount,
            quantity,
            unit,
            minimumOrderQuantity,
            stockQuantity,
            preparationTime,
            cutType,
            meatType,
            freshnessGuarantee,
            storageInstructions,
            shelfLife,
            features,
            status,
            existingImages // specific field for images to keep
        } = req.body;

        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Prevent updates if product is forced-inactive
        if (product.status === 'forced-inactive') {
            return res.status(403).json({ message: 'This product has been flagged as forced-inactive by the admin and cannot be edited.' });
        }

        // Logic to merge images
        let finalImages = [];

        // 1. Add existing images (if any were sent back)
        if (existingImages) {
            if (typeof existingImages === 'string') {
                // If single URL or JSON string
                try {
                    const parsed = JSON.parse(existingImages);
                    if (Array.isArray(parsed)) finalImages = parsed;
                    else finalImages = [existingImages];
                } catch (e) {
                    finalImages = [existingImages];
                }
            } else if (Array.isArray(existingImages)) {
                finalImages = existingImages;
            }
        }

        // 2. Add new uploaded images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'products'
                    });
                    finalImages.push(result.secure_url);
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error("Upload failed in update:", err);
                }
            }
        }

        // Parse features
        let parsedFeatures = features;
        if (typeof features === 'string') {
            try {
                parsedFeatures = JSON.parse(features);
            } catch (e) {
                parsedFeatures = [];
            }
        }

        // Update fields
        product.productName = productName || product.productName;
        product.description = description || product.description;
        product.category = category || product.category;
        product.originalPrice = originalPrice;
        product.sellingPrice = sellingPrice;
        product.discount = discount;
        product.quantity = quantity;
        product.unit = unit;
        product.minimumOrderQuantity = minimumOrderQuantity;
        product.stockQuantity = stockQuantity;
        product.preparationTime = preparationTime;
        product.cutType = cutType;
        product.meatType = meatType;
        product.freshnessGuarantee = freshnessGuarantee;
        product.storageInstructions = storageInstructions;
        product.shelfLife = shelfLife;
        product.features = parsedFeatures || product.features;
        product.images = finalImages.length > 0 ? finalImages : product.images; // Only update if we have images, or logic dictates
        // Note: tricky part. If user deleted ALL images, finalImages would be empty. 
        // We should explicitly set it to finalImages even if empty, IF the user intended to clear them.
        // For now, assuming user sends "existingImages" as [] if they want to clear old ones.
        if (existingImages || (req.files && req.files.length > 0)) {
            product.images = finalImages;
        }

        product.status = status || product.status;

        const updatedProduct = await product.save();
        res.json(updatedProduct);

    } catch (error) {
        console.error("Error updating product:", error);
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
