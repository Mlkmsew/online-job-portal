// ============================================
// Auth Middleware - JWT Verification & RBAC
// ============================================
const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookie
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.isSuspended || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    if (user.status === 'rejected' || user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: user.status === 'rejected'
          ? 'Your account was not approved. Please contact support for more information.'
          : 'Your account is awaiting approval. Please check back later.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * Optional auth - attaches user if token present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (
        user &&
        !user.isSuspended &&
        user.status !== 'suspended' &&
        user.status !== 'rejected' &&
        user.status !== 'pending' &&
        user.isActive
      ) {
        req.user = user;
      }
    }
    next();
  } catch {
    next(); // Continue without user
  }
};

/**
 * Role-based authorization
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

/**
 * Protect preview routes (document streaming) - accepts the token from the
 * Authorization header, an explicit ?token= query param (used by <iframe> src
 * where headers can't be set), or a cookie. Requires the admin role.
 * This exists so the Admin document-preview <iframe> can authenticate without
 * exposing Cloudinary credentials or relying on CORS/header injection.
 */
const protectPreview = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && typeof req.query.token === 'string') {
      token = req.query.token;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (user.isSuspended || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }
    if (user.status === 'rejected' || user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Account not authorized to access this route.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive.' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: `Role '${user.role}' is not authorized to access this route.` });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * Require verified email
 */
const requireEmailVerified = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' || req.user.isEmailVerified) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Please verify your email address to access this feature.',
  });
};

module.exports = { protect, optionalAuth, authorize, protectPreview, requireEmailVerified };
