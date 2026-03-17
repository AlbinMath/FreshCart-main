const mongoose = require('mongoose');
require('dotenv').config();

// Dual database connections
const usersConn = mongoose.createConnection(process.env.MONGODB_URI_Users);
const customerConn = mongoose.createConnection(process.env.MONGODB_URI_Customer);
const productsConn = mongoose.createConnection(process.env.MONGODB_URI_Products);
const chatbotConn = mongoose.createConnection(process.env.MONGODB_URI_ChatBot);
const announcementsConn = mongoose.createConnection(process.env.MONGODB_URI_Announcements);
const adminConn = mongoose.createConnection(process.env.MONGODB_URI_admin);

usersConn.on('connected', () => console.log('MongoDB Connected to Users Database'));
customerConn.on('connected', () => console.log('MongoDB Connected to Customer Database'));
productsConn.on('connected', () => console.log('MongoDB Connected to Products Database'));
chatbotConn.on('connected', () => console.log('MongoDB Connected to ChatBot Database'));
announcementsConn.on('connected', () => console.log('MongoDB Connected to Announcements Database'));
adminConn.on('connected', () => console.log('MongoDB Connected to Admin Database'));

module.exports = { 
    usersConn, 
    customerConn, 
    productsConn, 
    chatbotConn, 
    announcementsConn, 
    adminConn 
};
