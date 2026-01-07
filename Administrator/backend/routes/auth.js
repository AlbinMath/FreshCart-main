const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login Request Body:', req.body); // DEBUG LOG


    try {
        // 1. Check if user exists
        const user = await User.findOne({ email });
        console.log('User Query Result:', user); // DEBUG LOG


        if (!user) {
            console.log('Login failed: User not found for email', email);
            return res.status(400).json({ message: 'User not found' });
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Login failed: Password mismatch');
            return res.status(400).json({ message: 'Invalid password' });
        }

        // 3. Return success (and token in real app)
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
