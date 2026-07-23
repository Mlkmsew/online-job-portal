// ============================================
// Constants - Ethiopian Data & App Configuration
// ============================================

// Ethiopian Regions
export const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Central Ethiopia',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South Ethiopia',
  'South West Ethiopia',
  'Tigray',
];

// Major Ethiopian Cities
export const ETHIOPIAN_CITIES = {
  'Addis Ababa': ['Addis Ababa', 'Bole', 'Kirkos', 'Yeka', 'Arada'],
  'Oromia': ['Adama', 'Bishoftu', 'Jimma', 'Ambo', 'Nekemte', 'Shashamane'],
  'Amhara': ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Birhan', 'Debre Markos'],
  'Tigray': ['Mekelle', 'Adigrat', 'Axum', 'Shire'],
  'Somali': ['Jigjiga', 'Dire Dawa'],
  'Dire Dawa': ['Dire Dawa'],
  'Harari': ['Harar'],
  'Sidama': ['Hawassa'],
  'South Ethiopia': ['Arba Minch', 'Wolaita Sodo'],
};

// Job Categories
export const JOB_CATEGORIES = [
  'Information Technology',
  'Healthcare',
  'Agriculture',
  'Finance & Banking',
  'Education',
  'Engineering',
  'Construction',
  'Marketing & Sales',
  'Hospitality & Tourism',
  'Government & NGO',
  'Manufacturing',
  'Transport & Logistics',
  'Telecommunication',
  'Media & Communication',
  'Legal Services',
  'Customer Service',
];

// Job Types
export const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
  'Temporary',
];

// Work Modes
export const WORK_MODES = [
  'On-site',
  'Remote',
  'Hybrid',
];

// Experience Levels
export const EXPERIENCE_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Lead',
  'Manager',
  'Director',
  'Executive',
];

// Education Levels
export const EDUCATION_LEVELS = [
  'No Requirement',
  'High School',
  'Diploma',
  'Bachelor',
  'Master',
  'PhD',
  'Professional Certificate',
];

// Application Status
export const APPLICATION_STATUS = {
  pending: { label: 'Pending', color: 'yellow' },
  reviewed: { label: 'Reviewed', color: 'blue' },
  shortlisted: { label: 'Shortlisted', color: 'purple' },
  interview: { label: 'Interview', color: 'indigo' },
  offered: { label: 'Offered', color: 'green' },
  accepted: { label: 'Accepted', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  withdrawn: { label: 'Withdrawn', color: 'gray' },
};

// Language Proficiency
export const LANGUAGE_PROFICIENCY = [
  'Basic',
  'Conversational',
  'Proficient',
  'Fluent',
  'Native',
];

// Ethiopian Languages
export const ETHIOPIAN_LANGUAGES = [
  'Amharic',
  'Afaan Oromo',
  'Tigrinya',
  'Somali',
  'Afar',
  'English',
];

// Skills by Category
export const SKILLS_BY_CATEGORY = {
  'Programming': [
    'JavaScript', 'Python', 'Java', 'C++', 'PHP', 'Ruby', 'Go', 'Rust',
  ],
  'Web Development': [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Django', 'Laravel', 'ASP.NET',
  ],
  'Mobile Development': [
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS',
  ],
  'Database': [
    'MongoDB', 'MySQL', 'PostgreSQL', 'Oracle', 'Redis', 'Cassandra',
  ],
  'DevOps': [
    'Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Azure', 'GCP', 'CI/CD',
  ],
  'Soft Skills': [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management',
  ],
  'Management': [
    'Project Management', 'Agile', 'Scrum', 'Product Management',
  ],
  'Design': [
    'UI/UX Design', 'Graphic Design', 'Figma', 'Adobe XD', 'Photoshop',
  ],
};

// Company Sizes
export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
];

// Employment Types
export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
];

// Salary Periods
export const SALARY_PERIODS = [
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
  'Yearly',
];

// Date Formats
export const DATE_FORMATS = {
  short: 'MMM dd, yyyy',
  long: 'MMMM dd, yyyy',
  full: 'EEEE, MMMM dd, yyyy',
  time: 'hh:mm a',
  dateTime: 'MMM dd, yyyy hh:mm a',
};

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    verifyEmail: '/auth/verify-email',
    sendOTP: '/auth/send-otp',
    verifyOTP: '/auth/verify-otp',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  jobs: {
    list: '/jobs',
    create: '/jobs',
    single: (id) => `/jobs/${id}`,
    update: (id) => `/jobs/${id}`,
    delete: (id) => `/jobs/${id}`,
    apply: '/applications',
  },
  companies: {
    list: '/companies',
    single: (id) => `/companies/${id}`,
    create: '/companies',
  },
};

// Pagination
export const PAGINATION = {
  defaultLimit: 10,
  maxLimit: 50,
};

// File Upload Limits
export const FILE_LIMITS = {
  avatar: 5 * 1024 * 1024, // 5MB
  cv: 10 * 1024 * 1024, // 10MB
  certificate: 10 * 1024 * 1024, // 10MB
  logo: 5 * 1024 * 1024, // 5MB
};

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Toast Notification Duration
export const TOAST_DURATION = {
  success: 3000,
  error: 5000,
  info: 4000,
};

// Theme Colors
export const THEME_COLORS = {
  primary: '#0F766E',
  secondary: '#14B8A6',
  accent: '#F59E0B',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export default {
  ETHIOPIAN_REGIONS,
  ETHIOPIAN_CITIES,
  JOB_CATEGORIES,
  JOB_TYPES,
  WORK_MODES,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  APPLICATION_STATUS,
  LANGUAGE_PROFICIENCY,
  ETHIOPIAN_LANGUAGES,
  SKILLS_BY_CATEGORY,
  COMPANY_SIZES,
  EMPLOYMENT_TYPES,
  SALARY_PERIODS,
  DATE_FORMATS,
  API_ENDPOINTS,
  PAGINATION,
  FILE_LIMITS,
  ALLOWED_FILE_TYPES,
  TOAST_DURATION,
  THEME_COLORS,
};
