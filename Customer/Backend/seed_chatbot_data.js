const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI_ChatBot;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI_ChatBot is not defined in .env');
    process.exit(1);
}

const faqSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    tag: { type: String },
    responses: [{ type: String }]
});

// Seed Data based on User's Request
const seedData = [
    // Greeting
    {
        question: "hi",
        answer: "Hello 👋 Welcome to FreshCart. How can I help you today?",
        tag: "greeting",
        responses: ["Hi there! How can I assist you?", "Greetings! Welcome to FreshCart."]
    },
    {
        question: "hello",
        answer: "Hello 👋 Welcome to FreshCart. How can I help you today?",
        tag: "greeting"
    },

    // Help / Features
    {
        question: "what can you do",
        answer: "I can help you find products, check prices, track your orders, and answer questions about FreshCart!",
        tag: "help"
    },

    // Price Check (Generic - specific products handled by dynamic search)
    {
        question: "price of",
        answer: "I can check prices for you! Just tell me the product name, like 'Price of onion' or 'How much is milk?'.",
        tag: "price_info",
        responses: ["Please specify the product name to check its price."]
    },

    // Add to Cart
    {
        question: "add to cart",
        answer: "To add items, please visit the product page and click 'Add to Cart'. I can help you find the product page first!",
        tag: "cart_help"
    },

    // View Cart
    {
        question: "show my cart",
        answer: "You can view your cart by clicking the Cart icon 🛒 in the top right corner.",
        tag: "view_cart"
    },

    // Delivery / Tracking
    {
        question: "where is my order",
        answer: "I can track your latest order. Just ask 'Where is my order?' or 'Order status' and I'll check for you!",
        tag: "order_tracking"
    },
    {
        question: "track order",
        answer: "I can check your latest order status. Just ask 'Status of my order'.",
        tag: "order_tracking"
    },

    // Refunds / Issues
    {
        question: "refund",
        answer: "I'm sorry to hear you have an issue. Please go to the 'My Orders' section and select 'Request Refund' for the specific item, or contact support.",
        tag: "refund"
    },
    {
        question: "complaint",
        answer: "We apologize for the inconvenience. Please describe your issue or contact our customer support team directly at support@freshcart.com.",
        tag: "complaint"
    },

    // Seller Support
    {
        question: "how to sell",
        answer: "👨‍🌾 You can register as a seller! Click 'Become a Seller' in the footer to start your application.",
        tag: "seller_info"
    },

    // Goodbye
    {
        question: "thank you",
        answer: "😊 You're welcome! Happy shopping with FreshCart.",
        tag: "goodbye",
        responses: ["Glad I could help!", "Anytime! Have a fresh day!"]
    },
    {
        question: "bye",
        answer: "Goodbye! See you next time.",
        tag: "goodbye"
    }
];

async function seedInDB() {
    try {
        const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
        console.log('Connected to ChatBot Database');

        const FAQ = conn.model('FAQ', faqSchema, 'faqs');

        console.log('Clearing existing FAQs...');
        await FAQ.deleteMany({});

        console.log('Inserting seed data...');
        await FAQ.insertMany(seedData);

        console.log('✅ ChatBot Database seeded successfully!');
        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seedInDB();
