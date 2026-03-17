const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const jwt = require('jsonwebtoken');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'freshcart_jwt_secret_key_here';

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if role is admin or administrator (both can seemingly announce? or just admin?)
    // User request implies Admin Dashboard usage.
    if (decoded.role !== 'admin' && decoded.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create announcement
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    console.log('Announcement POST received');
    console.log('Body:', req.body);
    console.log('User:', req.user);

    const { title, content } = req.body;

    const newAnnouncement = new Announcement({
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      author: req.user.email
    });

    const savedAnnouncement = await newAnnouncement.save();
    res.status(201).json(savedAnnouncement);
  } catch (error) {
    console.error('Announcement Create Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete announcement
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;