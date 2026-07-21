// ============================================
// Request Validation Middleware (express-validator)
// ============================================
const { validationResult, body, param, query } = require('express-validator');

// Run validation and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ---- Auth Validators ----
const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[0-9])(?=.*[a-zA-Z])/)
    .withMessage('Password must contain at least one letter and one number'),
  body('role').optional().isIn(['jobseeker', 'employer']).withMessage('Invalid role'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

const resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[0-9])(?=.*[a-zA-Z])/)
    .withMessage('Password must contain letters and numbers'),
];

// ---- Job Validators ----
const jobValidator = [
  body('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('category').notEmpty().withMessage('Job category is required').isMongoId(),
  body('jobType')
    .notEmpty()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Temporary'])
    .withMessage('Invalid job type'),
  body('location.region').notEmpty().withMessage('Region is required'),
  body('applicationDeadline').notEmpty().isISO8601().withMessage('Valid deadline is required'),
];

// ---- Company Validators ----
const companyValidator = [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('description').optional().isLength({ max: 5000 }),
  body('industry').optional().notEmpty(),
];

// ---- Application Validators ----
const applicationValidator = [
  body('job').notEmpty().withMessage('Job ID is required').isMongoId(),
  body('coverLetter').optional().isLength({ max: 3000 }),
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  jobValidator,
  companyValidator,
  applicationValidator,
};
