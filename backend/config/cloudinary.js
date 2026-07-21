// ============================================
// Cloudinary Configuration
// ============================================
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ethiojob/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

// Storage for company logos
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ethiojob/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 300, height: 300, crop: 'fit' }],
  },
});

// Storage for CVs / resumes (PDF)
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ethiojob/cvs',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'raw',
  },
});

// Storage for certificates
const certStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ethiojob/certificates',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    resource_type: 'auto',
  },
});

// Multer instances
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadCert = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadLogo,
  uploadCV,
  uploadCert,
};
