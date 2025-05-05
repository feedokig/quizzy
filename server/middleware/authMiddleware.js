// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Verifying token:', token); // Отладочный вывод
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.log('User not found for token:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};