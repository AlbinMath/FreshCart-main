const mongoose = require('mongoose');
require('dotenv').config();

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI_Products);
        console.log('Connected to Products DB for seeding...');

        // Define schema inline to avoid importing server.js via Product.js
        const productSchema = new mongoose.Schema({
            productName: { type: String, required: true },
            description: String,
            category: { type: String, required: true },
            originalPrice: Number,
            sellingPrice: { type: Number, required: true },
            discount: Number,
            quantity: Number,
            unit: String,
            minimumOrderQuantity: Number,
            stockQuantity: { type: Number, default: 0 },
            preparationTime: String,
            cutType: String,
            meatType: String,
            freshnessGuarantee: String,
            storageInstructions: String,
            features: [String],
            images: [String],
            status: { type: String, enum: ['active', 'inactive'], default: 'active' },
            approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            sellerName: String,
            storeName: String,
            storeAddress: String,
            sellerUniqueId: String,
        }, { timestamps: true });

        const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

        const products = [
            {
                _id: "694133e84702280eeb0ea815",
                productName: "Fresh Curry Cut Chicken",
                description: "Farm-fresh chicken cleaned and cut into medium curry pieces. Hygienically processed and packed on the same day. Ideal for curries and traditional dishes",
                category: "Meat",
                originalPrice: 320,
                sellingPrice: 280,
                discount: 12,
                quantity: 1,
                unit: "kg",
                stockQuantity: 50,
                sellerName: "Akhil's",
                storeName: "Akhil's Store",
                storeAddress: "GRFH+Q59, Koovappally, Kerala 686518",
                sellerUniqueId: "FC-SEL-RXPFT5",
                meatType: "Chicken",
                cutType: "Curry Cut",
                preparationTime: "30 mins",
                freshnessGuarantee: "1 Day",
                storageInstructions: "Keep Refrigerated (0-4°C)",
                images: [
                    "https://res.cloudinary.com/dune3hshk/image/upload/v1765880804/products/jjdrqvxc6ctzepfrbvdw.jpg",
                    "https://res.cloudinary.com/dune3hshk/image/upload/v1765880805/products/yow9awpzqb1d8qynunql.jpg",
                    "https://res.cloudinary.com/dune3hshk/image/upload/v1765880806/products/z9tebxu4eujxkp38dxa8.jpg"
                ],
                status: "active",
                approvalStatus: "Pending",
                features: [],
                createdAt: "2025-12-16T10:26:48.397+00:00",
                updatedAt: "2025-12-17T09:38:38.968+00:00"
            }
        ];

        // Check if product exists to avoid duplicates or error on duplicate key
        for (const p of products) {
            const exists = await Product.findById(p._id);
            if (!exists) {
                await Product.create(p);
                console.log(`Seeded: ${p.productName}`);
            } else {
                console.log(`Skipped (Exists): ${p.productName}`);
            }
        }

        console.log('Seeding complete.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedProducts();
