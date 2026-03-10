require('dotenv').config();
const mongoose = require('mongoose');

const seedPromotions = async () => {
    try {
        const productDB = mongoose.createConnection(process.env.MONGODB_URI_Products);

        const couponSchema = new mongoose.Schema({
            sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: false },
            code: { type: String, required: true, uppercase: true, trim: true },
            discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
            discountValue: { type: Number, required: true },
            startYear: { type: Number, required: true, default: new Date().getFullYear() },
            validFromDate: { type: String, required: true, match: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/ },
            validToDate: { type: String, required: true, match: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/ },
            maxUsesPerUser: { type: Number, default: 1 },
            keywords: [{ type: String, trim: true }],
            usedCount: { type: Number, default: 0 },
            isActive: { type: Boolean, default: true }
        }, { timestamps: true });

        const Coupon = productDB.model('Coupon', couponSchema);

        const coupons = [
            {
                sellerId: null,
                code: 'NEWUSER',
                discountType: 'FIXED',
                discountValue: 50,
                startYear: 2024,
                validFromDate: '01-01',
                validToDate: '12-31',
                maxUsesPerUser: 1,
                keywords: ['welcome', 'new user'],
                isActive: true
            },
            {
                sellerId: null,
                code: 'NEWYEAR',
                discountType: 'PERCENTAGE',
                discountValue: 20,
                startYear: 2024,
                validFromDate: '12-26',
                validToDate: '01-05',
                maxUsesPerUser: 1,
                keywords: ['newyear', 'celebration'],
                isActive: true
            },
            {
                sellerId: null,
                code: 'CHRISTMAS',
                discountType: 'PERCENTAGE',
                discountValue: 15,
                startYear: 2024,
                validFromDate: '12-15',
                validToDate: '12-25',
                maxUsesPerUser: 1,
                keywords: ['christmas', 'xmas'],
                isActive: true
            }
        ];

        for (let c of coupons) {
            await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
            console.log(`Seeded coupon ${c.code}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error seeding coupons", err);
        process.exit(1);
    }
};

seedPromotions();
