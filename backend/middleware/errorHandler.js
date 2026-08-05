// ============================================
// Global Error Handler Middleware
// ============================================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id: ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired.';
    statusCode = 401;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File size too large.';
    statusCode = 400;
  }

  // Unsupported file type from custom fileFilter
  if (err.code === 'UNSUPPORTED_FILE_TYPE') {
    message = 'Only PDF, DOC, or DOCX files are allowed.';
    statusCode = 400;
  }

  const payload = { success: false, message };
  if (err.code) payload.code = err.code;

  if (process.env.NODE_ENV === 'development') {
    payload.error = err;
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = { errorHandler, notFound, AppError };
