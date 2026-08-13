// ============================================
// Cloudinary Configuration
// ============================================
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

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

// Storage for company assets uploaded during profile creation
const companyStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const field = file.fieldname;
    const folderMap = {
      logo: 'ethiojob/companies/logos',
      coverImage: 'ethiojob/companies/covers',
      businessLicense: 'ethiojob/company-documents',
      tinCertificate: 'ethiojob/company-documents',
      companyRegistration: 'ethiojob/company-documents',
    };
    return {
      folder: folderMap[field] || 'ethiojob/company-assets',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf', 'doc', 'docx'],
      resource_type: 'auto',
    };
  },
});

// Storage for CVs / resumes (PDF)
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ethiojob/cvs',
    resource_type: 'auto',
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

// Storage for chat message attachments (PDF, DOC, DOCX, images)
const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ethiojob/chat-attachments',
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'auto',
  },
});

// Multer instances
const uploadChat = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      return cb(null, true);
    }

    const err = new Error('Unsupported file format. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP.');
    err.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(err, false);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadCompany = multer({
  storage: companyStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      return cb(null, true);
    }

    const err = new Error('Unsupported resume file format. Allowed: PDF, DOC, DOCX.');
    err.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(err, false);
  },
});

const uploadCert = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExts.includes(ext);

    // Reject files whose extension and MIME type disagree (spoofing attempt)
    if (mimeOk && extOk) return cb(null, true);

    const err = new Error(
      'Unsupported certificate file format. Allowed: PDF, JPG, PNG. The file extension and file type must match.'
    );
    err.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(err, false);
  },
});

module.exports = {
  cloudinary,
  uploadChat,
  uploadAvatar,
  uploadLogo,
  uploadCompany,
  uploadCV,
  uploadCert,
};
