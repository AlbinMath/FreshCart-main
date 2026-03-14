const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.status(200).json({ success: true, notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/notifications
router.delete('/', async (req, res) => {
    try {
        await Notification.deleteMany({});
        res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
