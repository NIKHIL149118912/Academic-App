/**
 * Authentication Middleware
 * Verifies JWT access tokens and attaches user to request
 */

const { verifyAccessToken } = require('../utils/jwtToken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user based on role
    let user;
    switch (decoded.role) {
      case 'student':
        user = await Student.findById(decoded.id).select('-password -refreshToken');
        break;
      case 'teacher':
        user = await Teacher.findById(decoded.id).select('-password -refreshToken');
        break;
      case 'admin':
        user = await Admin.findById(decoded.id).select('-password -refreshToken');
        break;
      default:
        return res.status(401).json({ success: false, message: 'Invalid role in token.' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // For teachers: check approval status
    if (decoded.role === 'teacher' && !user.isApproved) {
      return res.status(403).json({ success: false, message: 'Teacher account pending admin approval.' });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    logger.warn(`Auth middleware error: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

module.exports = { protect };
