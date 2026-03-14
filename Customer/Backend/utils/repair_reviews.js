const mongoose = require('mongoose');
require('dotenv').config();

// Define Schemas inline to keep script self-contained
const reviewSchema = new mongoose.Schema({
    userId: String,
    orderId: String,
    productId: String,
    productName: String,
    productImage: String,
    qualityRate: Number,
    overallRate: Number,
    reviewText: String,
});

const orderSchema = new mongoose.Schema({
    orderId: String,
    items: [{
        productId: String,
        productName: String,
        image: String
    }]
});

const productSchema = new mongoose.Schema({
    productName: String,
    images: [String]
});

async function backfillReviews() {
    try {
        console.log('--- Database Repair: Backfilling Reviews ---');
        
        // Connect to Products Database where Reviews and Orders are stored
        const connectionString = process.env.MONGODB_URI_Products;
        if (!connectionString) {
            console.error('Error: MONGODB_URI_Products not found in .env');
            return;
        }

        const conn = await mongoose.createConnection(connectionString).asPromise();
        console.log('Connected to Products Database');

        const Review = conn.model('Review', reviewSchema, 'Reviews');
        const Order = conn.model('Order', orderSchema, 'Orders');
        const Product = conn.model('Product', productSchema, 'products');

        // 1. Find all reviews that are either "ORDER_LEVEL" or missing product info
        const reviewsToFix = await Review.find({
            $or: [
                { productId: "ORDER_LEVEL" },
                { productName: { $exists: false } },
                { productImage: { $exists: false } }
            ]
        });

        console.log(`Found ${reviewsToFix.length} reviews that need repair...`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const review of reviewsToFix) {
            try {
                // Find corresponding order
                // The orderId might be the MongoDB _id or the custom alphanumeric ORD-XXXXXX
                const order = await Order.findById(review.orderId).catch(() => null) || 
                              await Order.findOne({ orderId: review.orderId }).catch(() => null);

                if (!order) {
                    console.warn(`[WARN] Could not find order for review: ${review._id} (Order IDs checked: ${review.orderId})`);
                    errorCount++;
                    continue;
                }

                if (!order.items || order.items.length === 0) {
                    console.warn(`[WARN] Order ${review.orderId} has no items.`);
                    errorCount++;
                    continue;
                }

                // Associate with first product if currently ORDER_LEVEL
                let pid = review.productId;
                if (pid === "ORDER_LEVEL") {
                    pid = order.items[0].productId || order.items[0]._id;
                    review.productId = pid;
                }

                // Try to get fresh details from Product collection for better quality info
                const product = await Product.findById(pid).catch(() => null);
                
                if (product) {
                    review.productName = product.productName;
                    review.productImage = product.images && product.images.length > 0 ? product.images[0] : null;
                } else {
                    // Fallback to what was in the order at time of purchase
                    const item = order.items.find(i => (i.productId || i._id).toString() === pid.toString()) || order.items[0];
                    review.productName = item.productName;
                    review.productImage = item.image;
                }

                await review.save();
                fixedCount++;
                process.stdout.write('.'); // Progress indicator
            } catch (err) {
                console.error(`\n[ERROR] Failed to fix review ${review._id}:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n\n--- Repair Ready ---`);
        console.log(`Reviews Updated: ${fixedCount}`);
        console.log(`Could not fix: ${errorCount}`);
        
        await conn.close();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Fatal script error:', error);
        process.exit(1);
    }
}

backfillReviews();
