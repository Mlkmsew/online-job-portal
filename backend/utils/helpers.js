// ============================================
// General Helper Utilities
// ============================================
const crypto = require('crypto');

/**
 * Async error wrapper - eliminates try/catch boilerplate
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Paginate results helper
 */
const paginate = async (model, query, queryString, populate = [], sortBy = '-createdAt') => {
  const page = parseInt(queryString.page) || 1;
  const limit = parseInt(queryString.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await model.countDocuments(query);

  let dbQuery = model.find(query).skip(skip).limit(limit).sort(sortBy);
  if (populate.length) {
    populate.forEach((p) => {
      dbQuery = dbQuery.populate(p);
    });
  }

  const results = await dbQuery;

  return {
    results,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Create notification helper
 */
const createNotification = async (data) => {
  const Notification = require('../models/Notification');
  return await Notification.create(data);
};

/**
 * Hash a token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Escape user input for safe RegExp construction
 */
const escapeRegex = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Pick only allowed fields from object
 */
const pick = (obj, fields) => {
  const result = {};
  fields.forEach((field) => {
    if (obj[field] !== undefined) result[field] = obj[field];
  });
  return result;
};

/**
 * Format salary range string
 */
const formatSalary = (salary) => {
  if (!salary) return 'Not specified';
  const { min, max, currency, period, isNegotiable } = salary;
  if (!min && !max) return isNegotiable ? 'Negotiable' : 'Not specified';
  const fmt = (n) => n?.toLocaleString('en-ET') || '';
  const range = min && max ? `${fmt(min)} - ${fmt(max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(max)}`;
  return `${currency || 'ETB'} ${range} / ${period || 'Month'}${isNegotiable ? ' (Negotiable)' : ''}`;
};

module.exports = { asyncHandler, paginate, createNotification, hashToken, pick, formatSalary, escapeRegex };
