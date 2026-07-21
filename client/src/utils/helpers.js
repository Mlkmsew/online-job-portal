// ============================================
// Helper Utility Functions
// ============================================
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format date
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch {
    return '';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return '';
  }
};

/**
 * Format salary
 */
export const formatSalary = (salary) => {
  if (!salary) return 'Not specified';
  const { min, max, currency = 'ETB', period = 'Monthly', isNegotiable } = salary;
  
  if (!min && !max) return isNegotiable ? 'Negotiable' : 'Not specified';
  
  const formatNumber = (n) => n?.toLocaleString('en-ET') || '';
  const range = min && max 
    ? `${formatNumber(min)} - ${formatNumber(max)}` 
    : min ? `From ${formatNumber(min)}` 
    : `Up to ${formatNumber(max)}`;
  
  return `${currency} ${range} / ${period}${isNegotiable ? ' (Negotiable)' : ''}`;
};

/**
 * Truncate text
 */
export const truncate = (text, length = 100) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
};

/**
 * Generate random color
 */
export const getRandomColor = () => {
  const colors = [
    '#0F766E', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6',
    '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#6366F1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number (Ethiopian)
 */
export const isValidEthiopianPhone = (phone) => {
  const regex = /^(\+251|0)?[79]\d{8}$/;
  return regex.test(phone);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate slug from text
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get application status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewed: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-purple-100 text-purple-700',
    interview: 'bg-indigo-100 text-indigo-700',
    offered: 'bg-green-100 text-green-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || colors.pending;
};

/**
 * Calculate days remaining
 */
export const getDaysRemaining = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/**
 * Format deadline text
 */
export const formatDeadline = (deadline) => {
  const days = getDaysRemaining(deadline);
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days > 0) return `${days} days left`;
  return 'Expired';
};

/**
 * Check if job is expired
 */
export const isJobExpired = (deadline) => {
  return getDaysRemaining(deadline) === 0;
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Parse query string
 */
export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * Build query string
 */
export const buildQueryString = (params) => {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return filtered ? `?${filtered}` : '';
};

/**
 * Calculate profile completeness
 */
export const calculateProfileCompleteness = (profile) => {
  let score = 0;
  const fields = [
    { key: 'firstName', weight: 10 },
    { key: 'lastName', weight: 10 },
    { key: 'email', weight: 10 },
    { key: 'phone', weight: 5 },
    { key: 'avatar', weight: 5 },
    { key: 'headline', weight: 5 },
    { key: 'bio', weight: 10 },
    { key: 'location', weight: 5 },
    { key: 'skills', weight: 10, isArray: true },
    { key: 'education', weight: 10, isArray: true },
    { key: 'experience', weight: 10, isArray: true },
    { key: 'cv', weight: 10 },
  ];

  fields.forEach(({ key, weight, isArray }) => {
    const value = profile[key];
    if (isArray ? value?.length > 0 : value) {
      score += weight;
    }
  });

  return Math.min(score, 100);
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return num?.toLocaleString('en-ET') || '0';
};

/**
 * Check if user is online (last seen within 5 minutes)
 */
export const isUserOnline = (lastSeen) => {
  if (!lastSeen) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastSeen) > fiveMinutesAgo;
};

export default {
  formatDate,
  formatRelativeTime,
  formatSalary,
  truncate,
  getInitials,
  getRandomColor,
  isValidEmail,
  isValidEthiopianPhone,
  formatFileSize,
  debounce,
  slugify,
  copyToClipboard,
  getStatusColor,
  getDaysRemaining,
  formatDeadline,
  isJobExpired,
  generateId,
  parseQueryString,
  buildQueryString,
  calculateProfileCompleteness,
  formatNumber,
  isUserOnline,
};
