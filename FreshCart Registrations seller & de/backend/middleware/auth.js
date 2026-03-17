const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Administrator = require('../models/Administrator');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ message: 'Admin not found' });
      }
      req.user = admin;
      req.role = 'admin';
    } else if (decoded.role === 'administrator') {
      const administrator = await Administrator.findById(decoded.id).select('-password');
      if (!administrator) {
        return res.status(401).json({ message: 'Administrator not found' });
      }
      req.user = administrator;
      req.role = 'administrator';
    } else {
      return res.status(401).json({ message: 'Invalid role' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

const administratorAuth = (req, res, next) => {
  if (req.role !== 'administrator') {
    return res.status(403).json({ message: 'Access denied. Administrators only.' });
  }
  next();
};

module.exports = { auth, adminAuth, administratorAuth };