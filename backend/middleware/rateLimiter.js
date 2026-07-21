// ============================================
// Rate Limiting Middleware
// ============================================
const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development';
const dummyMiddleware = (req, res, next) => next();

// General API limiter
const apiLimiter = isDev ? dummyMiddleware : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 1000),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

// Strict limiter for auth routes
const authLimiter = isDev ? dummyMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

// Very strict for password reset
const passwordResetLimiter = isDev ? dummyMiddleware : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in an hour.',
  },
  skipFailedRequests: true,
});

// File upload limiter
const uploadLimiter = isDev ? dummyMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many upload requests.' },
  skipFailedRequests: true,
});

module.exports = { apiLimiter, authLimiter, passwordResetLimiter, uploadLimiter };
