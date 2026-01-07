const mongoose = require('mongoose');
const { chatbotConn } = require('../server');

const faqSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    tag: { type: String },
    responses: [{ type: String }] // Array of strings for alternative matches
});

// Explicitly use 'faqs' collection
const FAQ = chatbotConn.model('FAQ', faqSchema, 'faqs');

module.exports = FAQ;
