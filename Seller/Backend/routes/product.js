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
            lowStockThreshold,

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

        // Generate Product ID
        // Format: P-[TimestampLast6]-[Random3] e.g., P-123456-789
        const generateProductId = () => {
            const prefix = 'PID';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `${prefix}-${timestamp}-${random}`;
        };

        const product_id = generateProductId();

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
            lowStockThreshold,
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
            sellerUniqueId,
            product_id
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
        let products = await Product.find({ sellerUniqueId: req.params.sellerUniqueId }).sort({ createdAt: -1 });

        // Backfill IDs if missing
        let hasUpdates = false;
        const updates = products.map(async (p) => {
            if (!p.product_id) {
                const prefix = 'PID';
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                p.product_id = `${prefix}-${timestamp}-${random}`;
                hasUpdates = true;
                return p.save();
            }
            return Promise.resolve();
        });

        if (hasUpdates) {
            await Promise.all(updates);
            // Re-fetch or return updated instances (in memory 'products' usually has the updates if modified directly, but safety first)
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Upload a single product image (Quick Upload)
// @route   PATCH /api/products/image/:id
router.patch('/image/:id', upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products'
        });

        // Add to images array
        product.images.push(result.secure_url);

        // If it was the first image/no image before, this becomes the main one implicitly by order
        await product.save();

        // Remove temp file
        fs.unlinkSync(req.file.path);

        res.json(product);

    } catch (error) {
        console.error("Error uploading image:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
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
            lowStockThreshold,
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

        // Update fields - safely parse numerics to prevent Mongoose validation errors
        product.productName = productName || product.productName;
        product.description = description || product.description;
        product.category = category || product.category;
        product.status = status || product.status;

        if (originalPrice !== undefined && originalPrice !== '') product.originalPrice = parseFloat(originalPrice);
        if (sellingPrice !== undefined && sellingPrice !== '') product.sellingPrice = parseFloat(sellingPrice);
        if (discount !== undefined && discount !== '') product.discount = parseFloat(discount);
        if (quantity !== undefined && quantity !== '') product.quantity = parseFloat(quantity);
        if (unit !== undefined) product.unit = unit;
        if (minimumOrderQuantity !== undefined && minimumOrderQuantity !== '') product.minimumOrderQuantity = parseInt(minimumOrderQuantity);
        if (stockQuantity !== undefined && stockQuantity !== '') product.stockQuantity = parseInt(stockQuantity);
        if (lowStockThreshold !== undefined && lowStockThreshold !== '') product.lowStockThreshold = parseInt(lowStockThreshold);
        if (preparationTime !== undefined) product.preparationTime = preparationTime;
        if (cutType !== undefined) product.cutType = cutType;
        if (meatType !== undefined) product.meatType = meatType;
        if (freshnessGuarantee !== undefined) product.freshnessGuarantee = freshnessGuarantee;
        if (storageInstructions !== undefined) product.storageInstructions = storageInstructions;
        if (shelfLife !== undefined) product.shelfLife = shelfLife;
        if (parsedFeatures) product.features = parsedFeatures;

        // Only update images if existingImages field was sent or new files were uploaded
        if (existingImages !== undefined || (req.files && req.files.length > 0)) {
            product.images = finalImages;
        }

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

// @desc    Delete a product
// @route   DELETE /api/products/delete/:id
router.delete('/delete/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Ideally, check for seller ownership here if valid auth/seller info is passed.
        // For now, proceeding with deletion.

        // Delete images from Cloudinary (Optional, good practice)
        // if (product.images && product.images.length > 0) {
        //     // Logic to delete from Cloudinary would go here
        // }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: 'Product removed' });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete ALL products for a seller
// @route   DELETE /api/products/delete-all/:sellerUniqueId
router.delete('/delete-all/:sellerUniqueId', async (req, res) => {
    try {
        const { sellerUniqueId } = req.params;
        if (!sellerUniqueId) {
            return res.status(400).json({ message: 'Seller Unique ID is required' });
        }

        const result = await Product.deleteMany({ sellerUniqueId });

        res.json({ message: `Deleted ${result.deletedCount} products.` });
    } catch (error) {
        console.error("Error deleting all products:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Bulk Add Products via CSV/JSON
// @route   POST /api/products/bulk-add
router.post('/bulk-add', async (req, res) => {
    try {
        const { products } = req.body; // Expecting { products: [...] }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'No products provided for bulk import.' });
        }

        const results = [];
        const errors = [];
        const skipped = [];

        // Assume all products in the batch belong to the same seller (as per current frontend logic)
        const sellerUniqueId = products[0].sellerUniqueId;

        // Fetch existing products for this seller to check duplicates
        // Optimization: Fetch only necessary fields or fetch all if dataset is small enough. 
        // For large datasets, this might need optimization (e.g. bloom filter or specific queries), 
        // but for typical seller inventory (hundreds/thousands), fetching standard fields is okay.
        const existingProducts = await Product.find({ sellerUniqueId });

        const isDuplicate = (newP, oldP) => {
            if (newP.productName !== oldP.productName) return false;
            if (newP.description !== oldP.description) return false;
            // if (newP.sellingPrice !== oldP.sellingPrice) return false; // Float comparison might be tricky, but assuming exact match for now
            if (Math.abs(newP.sellingPrice - oldP.sellingPrice) > 0.01) return false;
            if (newP.category !== oldP.category) return false;
            // if (newP.originalPrice !== oldP.originalPrice) return false;
            if (Math.abs((newP.originalPrice || 0) - (oldP.originalPrice || 0)) > 0.01) return false;

            // Features check
            // Normalize features for comparison (sort by key?)
            const newF = newP.features || [];
            const oldF = oldP.features || [];
            if (newF.length !== oldF.length) return false;

            // Simple O(N^2) check or sort then O(N)
            // Let's try stringifying sorted keys
            const sortF = (f) => JSON.stringify(f.map(i => ({ k: i.key, v: i.value })).sort((a, b) => a.k.localeCompare(b.k)));
            if (sortF(newF) !== sortF(oldF)) return false;

            return true;
        };

        for (const productData of products) {
            try {
                // Check duplication
                const existing = existingProducts.find(ep => isDuplicate(productData, ep));

                if (existing) {
                    skipped.push(productData.productName);
                    continue;
                }

                // generate ID
                const generateProductId = () => {
                    const prefix = 'PID';
                    const timestamp = Date.now().toString().slice(-6);
                    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    return `${prefix}-${timestamp}-${random}`;
                };

                const newProduct = new Product({
                    ...productData,
                    product_id: productData.product_id || generateProductId(),
                    stockQuantity: productData.stockQuantity || 0,
                    sellingPrice: productData.sellingPrice || 0,
                    quantity: productData.quantity || 1,
                    unit: productData.unit || 'pc',
                    status: productData.status || 'active',
                });

                await newProduct.save();
                results.push(newProduct.productName);
            } catch (err) {
                console.error("Error saving product in bulk:", err);
                errors.push({ name: productData.productName, error: err.message });
            }
        }

        res.status(201).json({
            message: `Processed import: ${results.length} added, ${skipped.length} skipped (duplicate), ${errors.length} failed.`,
            addedCount: results.length,
            skippedCount: skipped.length,
            errors: errors
        });

    } catch (error) {
        console.error("Bulk add error:", error);
        res.status(500).json({ message: 'Server Error during bulk import', error: error.message });
    }
});

// @desc    Update product stock only
// @route   PATCH /api/products/stock/:id
router.patch('/stock/:id', async (req, res) => {
    try {
        const { stockQuantity } = req.body;

        if (stockQuantity === undefined || stockQuantity === null) {
            return res.status(400).json({ message: 'Stock quantity is required' });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { stockQuantity: parseInt(stockQuantity) },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
