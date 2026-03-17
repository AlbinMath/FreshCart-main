const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Define chat message schema
const chatMessageSchema = new mongoose.Schema({
  senderRole: {
    type: String,
    enum: ['admin', 'administrator'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create model (or you could move this to a separate models file)
const ChatMessage = mongoose.model('AdminAdministratorCommunication', chatMessageSchema);

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'freshcart_jwt_secret_key_here';

// Middleware to authenticate users
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!['admin', 'administrator'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied. Admins and administrators only.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get chat messages
router.get('/admin-admin', authenticateUser, async (req, res) => {
  try {
    // Get messages from the last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    const messages = await ChatMessage.find({
      createdAt: { $gte: twoDaysAgo }
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// Send chat message
router.post('/admin-admin', authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    const chatMessage = new ChatMessage({
      senderRole: req.user.role,
      senderId: req.user.id,
      message
    });
    
    await chatMessage.save();
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

module.exports = router;