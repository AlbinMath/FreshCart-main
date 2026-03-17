const express = require('express');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const Administrator = require('../models/Administrator');

const router = express.Router();

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'freshcart_jwt_secret_key_here';



// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required'
      });
    }

    let user = null;
    let modelName = '';

    // Find user based on role
    if (role === 'admin') {
      user = await Admin.findOne({ email });
      modelName = 'Admin';
    } else if (role === 'Administrator') { // Uppercase to match model
      user = await Administrator.findOne({ email });
      modelName = 'Administrator';
    } else {
      return res.status(400).json({
        message: 'Invalid role. Must be admin or Administrator'
      });
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: `${modelName} not found`
      });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

module.exports = router;