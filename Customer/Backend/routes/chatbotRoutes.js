const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User'); // Access Users DB
const axios = require('axios'); // Import Axios for Python API calls

router.post('/chat', async (req, res) => {
    try {
        const { message, userId } = req.body; // Expect userId from frontend
        if (!message) {
            return res.status(400).json({ response: "Please say something!" });
        }

        const userMessage = message.toLowerCase();

        // 0. Check for Order Status keywords - DISABLED (Python handles this now)
        /*
        if (userId && (userMessage.includes('order') || userMessage.includes('status') || userMessage.includes('delivery') || userMessage.includes('track'))) {
            const latestOrder = await Order.findOne({ userId: userId }).sort({ createdAt: -1 });

            if (latestOrder) {
                const date = new Date(latestOrder.createdAt).toLocaleDateString();
                const itemCount = latestOrder.items.length;
                return res.json({
                    response: `Your latest order (placed on ${date}) is currently **${latestOrder.status}**. It contains ${itemCount} items and the total was ₹${latestOrder.totalAmount}.`
                });
            } else {
                return res.json({ response: "I couldn't find any recent orders for your account." });
            }
        }
        */

        // 0.5 Check for Account/Profile
        if (userId && (userMessage.includes('my profile') || userMessage.includes('my account') || userMessage.includes('who am i'))) {
            const user = await User.findOne({ uid: userId });
            if (user) {
                return res.json({
                    response: `You are logged in as **${user.name || user.email}**. \nEmail: ${user.email}\nPhone: ${user.phoneNumber || 'Not set'}`
                });
            }

        }

        // 0.6 Try Python AI Service (Main Chatbot Logic)
        try {
            // Attempt to get response from Python/Groq Chatbot
            const pythonServiceUrl = process.env.chatbot_url;
            // Use /chat endpoint. Ensure URL doesn't have trailing slash or fix it.
            const targetUrl = `${pythonServiceUrl}/chat`.replace('//chat', '/chat');

            const pythonResponse = await axios.post(targetUrl, {
                message: message,
                userId: userId // Pass userId to Python
            });

            if (pythonResponse.data && pythonResponse.data.response) {
                return res.json(pythonResponse.data);
            }
        } catch (pyError) {
            console.warn("Python Chatbot Service unavailable:", pyError.message);
            // Fall through to local logic below...
        }

        // 1. Try to find a match in the database using regex for flexibility
        // We search in 'question' and 'tag'
        const faqs = await FAQ.find({});

        let bestMatch = null;

        // Simple keyword matching logic
        // In production, use Vector Search or ElasticSearch for better results
        for (const faq of faqs) {
            if (userMessage.includes(faq.question.toLowerCase()) ||
                (faq.tag && userMessage.includes(faq.tag.toLowerCase()))) {
                bestMatch = faq;
                break; // Return first match found
            }
        }

        if (bestMatch) {
            // Pick a random response if available, otherwise use default answer
            let responseText = bestMatch.answer;
            if (bestMatch.responses && bestMatch.responses.length > 0) {
                const allResponses = [bestMatch.answer, ...bestMatch.responses];
                const randomIndex = Math.floor(Math.random() * allResponses.length);
                responseText = allResponses[randomIndex];
            }
            return res.json({ response: responseText });
        }

        // 2. Search Products
        // Look for partial matches in product name or category
        const products = await Product.find({
            $or: [
                { productName: { $regex: userMessage, $options: 'i' } },
                { category: { $regex: userMessage, $options: 'i' } },
                { description: { $regex: userMessage, $options: 'i' } }
            ],
            status: 'Active', // Only show active products
            approvalStatus: 'Approved' // Only show approved products
        }).limit(3); // Limit to top 3

        if (products.length > 0) {
            const productNames = products.map(p => p.productName).join(', ');
            return res.json({
                response: `I found some products that might interest you: ${productNames}. You can find them in our store!`,
                products: products // Optional: Send structured data if frontend can display it
            });
        }

        // 3. Fallback responses
        if (userMessage.includes('hello') || userMessage.includes('hi')) {
            return res.json({ response: "Hello! Welcome to FreshCart. How can I assist you with your groceries today?" });
        }

        return res.json({ response: "I'm not sure about that. Try asking about our products, vegetables, or fruits!" });

    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ response: "Sorry, I'm having trouble thinking right now." });
    }
});

module.exports = router;
