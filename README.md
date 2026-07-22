# 🌍 OnlineJob Portal

**Connecting Ethiopian Youth with Employment Opportunities**

A complete, production-ready Online Job Portal Management System built with the MERN Stack (MongoDB, Express.js, React.js, Node.js).

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Seeding Database](#seeding-database)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Test Accounts](#test-accounts)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ User Registration & Login
- ✅ JWT Authentication
- ✅ Email Verification
- ✅ Password Reset
- ✅ Role-Based Access Control (Job Seeker, Employer, Admin)
- ✅ Refresh Tokens
- ✅ Secure Password Hashing (bcrypt)

### 👤 Job Seeker Features
- ✅ Complete Profile Management
- ✅ Upload Profile Picture, CV & Certificates
- ✅ Education & Experience History
- ✅ Skills & Languages
- ✅ Portfolio Projects
- ✅ Advanced Job Search & Filters
- ✅ Apply for Jobs
- ✅ Bookmark Jobs
- ✅ Track Application Status
- ✅ Withdraw Applications
- ✅ Real-time Notifications
- ✅ Dashboard Analytics

### 🏢 Employer Features
- ✅ Company Profile Management
- ✅ Upload Company Logo
- ✅ Post, Edit, Delete & Close Jobs
- ✅ View All Applicants
- ✅ Review Applications
- ✅ Accept/Reject Candidates
- ✅ Download CVs
- ✅ Interview Scheduling
- ✅ Messaging System
- ✅ Dashboard Analytics
- ✅ Application Management

### 👨‍💼 Admin Features
- ✅ Comprehensive Dashboard with Analytics
- ✅ Manage Users (Job Seekers & Employers)
- ✅ Manage Companies (Approve/Verify)
- ✅ Manage Jobs (Approve/Feature)
- ✅ Manage Categories
- ✅ Manage Skills
- ✅ Suspend/Delete Users
- ✅ View Reports & Analytics
- ✅ Charts & Statistics

### 🎨 UI/UX Features
- ✅ Modern, Clean & Professional Design
- ✅ Fully Responsive (Desktop, Tablet, Mobile)
- ✅ Dark Mode Support
- ✅ Smooth Animations (Framer Motion)
- ✅ Loading Skeletons
- ✅ Toast Notifications
- ✅ Form Validation
- ✅ Beautiful Cards & Shadows
- ✅ Glassmorphism Effects

### 🔍 Advanced Search & Filtering
- ✅ Keyword Search
- ✅ Location Filter (Region & City)
- ✅ Job Type Filter
- ✅ Salary Range Filter
- ✅ Experience Level
- ✅ Education Required
- ✅ Category Filter
- ✅ Remote/Hybrid Options
- ✅ Pagination & Sorting

### 📧 Email System
- ✅ Welcome Emails
- ✅ Email Verification
- ✅ Password Reset Emails
- ✅ Application Confirmation
- ✅ Interview Invitations
- ✅ Professional Email Templates

### 🔒 Security Features
- ✅ Helmet.js (Security Headers)
- ✅ CORS Configuration
- ✅ Rate Limiting
- ✅ Input Sanitization
- ✅ XSS Protection
- ✅ NoSQL Injection Prevention
- ✅ JWT with Refresh Tokens

---

## 🛠 Tech Stack

### Frontend
- **React.js** 18.3 - UI Library
- **React Router DOM** - Routing
- **Redux Toolkit** - State Management
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Icons** - Icons
- **React Hook Form** - Form Management
- **Chart.js** - Analytics Charts
- **SweetAlert2** - Beautiful Alerts
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **Nodemailer** - Email Service
- **Multer** - File Upload
- **Cloudinary** - Media Storage
- **Express Validator** - Input Validation

### Security & Utilities
- **Helmet** - Security Headers
- **CORS** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate Limiting
- **express-mongo-sanitize** - NoSQL Injection Prevention
- **xss-clean** - XSS Protection
- **compression** - Response Compression
- **morgan** - HTTP Logger

---

## 📁 Project Structure

```
ethio-job-portal/
│
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── cloudinary.js         # Cloudinary configuration
│   │   └── email.js              # Email configuration & templates
│   │
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── jobController.js      # Job management
│   │   ├── applicationController.js
│   │   ├── companyController.js
│   │   ├── adminController.js
│   │   ├── bookmarkController.js
│   │   ├── notificationController.js
│   │   ├── categoryController.js
│   │   ├── skillController.js
│   │   └── reviewController.js
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & RBAC
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── validate.js           # Input validation
│   │   └── rateLimiter.js        # Rate limiting
│   │
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Company.js            # Company model
│   │   ├── Job.js                # Job model
│   │   ├── Application.js        # Application model
│   │   ├── Category.js           # Category model
│   │   ├── Skill.js              # Skill model
│   │   ├── Notification.js       # Notification model
│   │   ├── Message.js            # Message model
│   │   ├── Interview.js          # Interview model
│   │   ├── Review.js             # Review model
│   │   └── Bookmark.js           # Bookmark model
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── companyRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── bookmarkRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── skillRoutes.js
│   │   └── reviewRoutes.js
│   │
│   ├── utils/
│   │   ├── jwt.js                # JWT utilities
│   │   ├── apiFeatures.js        # Search, filter, pagination
│   │   ├── helpers.js            # Helper functions
│   │   └── seeder.js             # Database seeder
│   │
│   ├── .env.example              # Environment variables template
│   └── index.js                  # Server entry point
│
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── assets/               # Images, fonts, etc.
│   │   │
│   │   ├── components/           # Reusable components
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   └── Modal.jsx
│   │   │   │
│   │   │   ├── job/
│   │   │   │   ├── JobCard.jsx
│   │   │   │   ├── JobFilters.jsx
│   │   │   │   └── JobSearch.jsx
│   │   │   │
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx    # Public pages layout
│   │   │   ├── DashboardLayout.jsx # Dashboard layout
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── JobDetails.jsx
│   │   │   ├── Companies.jsx
│   │   │   ├── CompanyDetails.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── FAQ.jsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   ├── ResetPassword.jsx
│   │   │   │   └── VerifyEmail.jsx
│   │   │   │
│   │   │   └── dashboard/
│   │   │       ├── jobseeker/
│   │   │       │   ├── Dashboard.jsx
│   │   │       │   ├── Profile.jsx
│   │   │       │   ├── MyApplications.jsx
│   │   │       │   └── SavedJobs.jsx
│   │   │       │
│   │   │       ├── employer/
│   │   │       │   ├── Dashboard.jsx
│   │   │       │   ├── PostJob.jsx
│   │   │       │   ├── ManageJobs.jsx
│   │   │       │   ├── ViewApplicants.jsx
│   │   │       │   └── CompanyProfile.jsx
│   │   │       │
│   │   │       └── admin/
│   │   │           ├── Dashboard.jsx
│   │   │           ├── ManageUsers.jsx
│   │   │           ├── ManageCompanies.jsx
│   │   │           └── ManageCategories.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js            # Axios configuration
│   │   │   ├── authService.js    # Auth API calls
│   │   │   ├── jobService.js     # Job API calls
│   │   │   └── ...
│   │   │
│   │   ├── store/
│   │   │   ├── store.js          # Redux store
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── jobSlice.js
│   │   │       ├── applicationSlice.js
│   │   │       └── notificationSlice.js
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── useDebounce.js
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── App.jsx               # Main App component
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   │
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── package.json                  # Root package.json
└── README.md                     # This file
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local or MongoDB Atlas)
- **npm** or **yarn**

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd ethio-job-portal
```

### Step 2: Install Backend Dependencies
```bash
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### Step 4: Setup Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ethiojob?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_change_in_production
JWT_REFRESH_EXPIRE=30d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=EthioJob Portal <noreply@ethiojob.com>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Step 5: Create Frontend .env File

Create a `.env` file in the `client` directory:

```bash
cd client
echo "VITE_API_URL=http://localhost:5000/api" > .env
cd ..
```

---

## 🏃‍♂️ Running the Application

### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### Run Backend Only
```bash
npm run server
```

### Run Frontend Only
```bash
npm run client
```

---

## 🌱 Seeding Database

To populate the database with sample data:

```bash
npm run seed
```

This will create:
- ✅ Admin user
- ✅ Sample job seeker
- ✅ Sample employer
- ✅ Sample companies
- ✅ Sample jobs
- ✅ Ethiopian regions
- ✅ Job categories (IT, Healthcare, Agriculture, etc.)
- ✅ Skills database

---

## 🔑 Test Accounts

After seeding the database, you can use these test accounts:

### Admin Account
```
Email: admin@ethiojob.com
Password: Admin@123
```

### Employer Account
```
Email: employer@ethiojob.com
Password: Password@123
```

### Job Seeker Account
```
Email: jobseeker@ethiojob.com
Password: Password@123
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/verify-email/:token` | Verify email |
| POST | `/auth/forgot-password` | Send password reset email |
| PUT | `/auth/reset-password/:token` | Reset password |
| PUT | `/auth/update-profile` | Update user profile |
| PUT | `/auth/upload-avatar` | Upload profile picture |
| PUT | `/auth/upload-cv` | Upload CV |

### Job Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | Get all jobs (with filters) |
| GET | `/jobs/:id` | Get single job |
| POST | `/jobs` | Create new job (Employer) |
| PUT | `/jobs/:id` | Update job |
| DELETE | `/jobs/:id` | Delete job |
| GET | `/jobs/my/posted` | Get my posted jobs |
| PUT | `/jobs/:id/close` | Close job |

### Application Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/applications` | Apply for job |
| GET | `/applications/my` | Get my applications |
| GET | `/applications/employer` | Get applications (Employer) |
| GET | `/applications/:id` | Get single application |
| PUT | `/applications/:id/status` | Update application status |
| PUT | `/applications/:id/withdraw` | Withdraw application |

### Company Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | Get all companies |
| GET | `/companies/:id` | Get single company |
| POST | `/companies` | Create company |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |
| PUT | `/companies/:id/logo` | Upload company logo |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Get dashboard statistics |
| GET | `/admin/users` | Get all users |
| PUT | `/admin/users/:id/suspend` | Suspend/activate user |
| PUT | `/admin/companies/:id/approve` | Approve company |
| PUT | `/admin/companies/:id/verify` | Verify company |
| PUT | `/admin/jobs/:id/feature` | Feature job |

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd client
vercel
```

3. **Set Environment Variables in Vercel Dashboard**
```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend Deployment (Render)

1. **Create New Web Service on Render**

2. **Connect your GitHub repository**

3. **Set Environment Variables** (from your .env file)

4. **Build Command**
```bash
npm install
```

5. **Start Command**
```bash
npm start
```

### Database (MongoDB Atlas)

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist all IPs (0.0.0.0/0) for production
3. Get connection string and add to your backend .env

---

## 📸 Screenshots

(Add your screenshots here after building the UI)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**EthioJob Portal Team**

---

## 🙏 Acknowledgments

- Ethiopian Youth for inspiring this project
- MERN Stack Community
- All contributors

---

## 📧 Support

For support, email support@ethiojob.com or join our community.

---

## ⭐ Star this repo if you find it helpful!

---

**Made with ❤️ for Ethiopian Youth**
