# COMPLETE PROJECT AUDIT — EthioJob Portal
## Online Job Portal for Ethiopian Youth

---

# PART 1 — COMPLETE PROJECT STRUCTURE

```
online-job-portal/
├── package.json                          # Root: scripts (dev, build, seed), concurrently runs backend+frontend
├── README.md
├── PROJECT_DOCUMENTATION_REPORT.md
├── verify-user-count.js                  # Standalone script to verify user count
├── temp-resume-builder-test.jsx          # Temporary test file
├── sample-certificates/                  # Sample certificate files for testing
│
├── backend/
│   ├── index.js                          # SERVER ENTRY: Express + Socket.IO + routes + MongoDB
│   ├── .env                              # Secrets (not in repo)
│   ├── .env.example                      # Template for all env vars
│   │
│   ├── config/
│   │   ├── db.js                         # MongoDB connection via Mongoose with retry
│   │   ├── cloudinary.js                 # Cloudinary SDK + Multer upload middleware factories
│   │   ├── email.js                      # Brevo HTTPS API + SMTP fallback (Nodemailer)
│   │   ├── otpPolicy.js                  # OTP generation, expiry, resend limits
│   │   └── socket.js                     # Socket.IO server: auth, rooms, events
│   │
│   ├── models/                           # 16 Mongoose models
│   │   ├── user.js                       # User (3 roles: jobseeker/employer/admin)
│   │   ├── job.js                        # Job postings
│   │   ├── Application.js                # Job applications
│   │   ├── Company.js                    # Employer companies
│   │   ├── Resume.js                     # Resume Builder documents
│   │   ├── Message.js                    # Conversations + Messages
│   │   ├── Interview.js                  # Interview scheduling
│   │   ├── CertificateVerification.js    # Verification attempts
│   │   ├── VerifiedCertificate.js        # Trusted certificate database
│   │   ├── Notification.js               # In-app notifications
│   │   ├── Bookmark.js                   # Job bookmarks
│   │   ├── Review.js                     # Company reviews
│   │   ├── SavedSearch.js                # Saved search filters
│   │   ├── JobAlert.js                   # Recurring job alerts
│   │   ├── Category.js                   # Job categories
│   │   └── Skill.js                      # Skills registry
│   │
│   ├── controllers/                      # 19 controller files
│   │   ├── authController.js             # Auth: register, login, Google, OTP, password reset, CV upload
│   │   ├── jobController.js              # Job CRUD, search, recommendations
│   │   ├── applicationController.js      # Applications: apply, status, shortlist, hire
│   │   ├── companyController.js          # Company CRUD, verification
│   │   ├── adminController.js            # Admin: users, companies, jobs, categories, skills, reports
│   │   ├── dashboardController.js        # Job seeker dashboard
│   │   ├── employerController.js         # Employer dashboard
│   │   ├── messageController.js          # Messaging: conversations, send, archive
│   │   ├── interviewController.js        # Interviews: schedule, update, feedback
│   │   ├── certificateController.js      # Certificate upload + verification
│   │   ├── resumeController.js           # Resume Builder CRUD
│   │   ├── notificationController.js     # Notification CRUD
│   │   ├── bookmarkController.js         # Bookmark CRUD
│   │   ├── reviewController.js           # Company review CRUD
│   │   ├── savedSearchController.js      # Saved search CRUD
│   │   ├── jobAlertController.js         # Job alert CRUD
│   │   ├── categoryController.js         # Category CRUD
│   │   ├── skillController.js            # Skill list
│   │   └── statsController.js            # Platform statistics
│   │
│   ├── routes/                           # 20 route files
│   │   ├── authRoutes.js                 # /api/auth/*
│   │   ├── jobRoutes.js                  # /api/jobs/*
│   │   ├── applicationRoutes.js          # /api/applications/*
│   │   ├── companyRoutes.js              # /api/companies/*
│   │   ├── adminRoutes.js                # /api/admin/*
│   │   ├── dashboardRoutes.js            # /api/dashboard/*
│   │   ├── employerRoutes.js             # /api/employer/*
│   │   ├── messageRoutes.js              # /api/messages/*
│   │   ├── interviewRoutes.js            # /api/interviews/*
│   │   ├── certificateRoutes.js          # /api/certificates/*
│   │   ├── resumeRoutes.js               # /api/resumes/*
│   │   ├── notificationRoutes.js         # /api/notifications/*
│   │   ├── bookmarkRoutes.js             # /api/bookmarks/*
│   │   ├── reviewRoutes.js               # /api/reviews/*
│   │   ├── savedSearchRoutes.js          # /api/saved-searches/*
│   │   ├── jobAlertRoutes.js             # /api/job-alerts/*
│   │   ├── categoryRoutes.js             # /api/categories/*
│   │   ├── skillRoutes.js                # /api/skills/*
│   │   ├── statsRoutes.js                # /api/stats/*
│   │   └── contactRoutes.js              # /api/contact/*
│   │
│   ├── middleware/
│   │   ├── auth.js                       # JWT verify, role authorize, email verified
│   │   ├── errorHandler.js               # Global error formatter
│   │   ├── rateLimiter.js                # Rate limiters (auth, API, upload, password reset)
│   │   └── validate.js                   # Express-validator middleware factories
│   │
│   ├── services/
│   │   └── emailService.js               # Contact form email sending
│   │
│   ├── utils/
│   │   ├── matching.js                   # AI/ML JOB MATCHING ENGINE (multi-factor scoring)
│   │   ├── dashboardHelpers.js           # Recommendation data source detection
│   │   ├── resumeParser.js               # CV parsing: PDF/DOCX/OCR pipeline
│   │   ├── certificateVerification.js    # Certificate verification engine
│   │   ├── certificateParser.js          # Certificate text/QR extraction
│   │   ├── jwt.js                        # JWT token generation + response helper
│   │   ├── helpers.js                    # Notifications, pagination, async handler
│   │   ├── apiFeatures.js                # Query builder (filter, sort, paginate)
│   │   ├── cloudinaryFile.js             # Signed URL downloads for Cloudinary
│   │   ├── getLocalIP.js                 # Local IP detection for dev
│   │   └── seeder.js                     # Database seeder
│   │
│   ├── scripts/
│   │   ├── diagnoseCv.js                 # CV diagnostic tool
│   │   ├── generateSampleCertificates.js # Sample cert generator
│   │   ├── seedCertificates.js           # Seed trusted certificates
│   │   ├── sendTestNow.js                # Test email sender
│   │   ├── smtpTest.js                   # SMTP connectivity checker
│   │   └── verifyCvDownload.js           # CV download verifier
│   │
│   └── tests/                            # 14 test files
│       ├── matching.test.js
│       ├── certificateVerification.test.js
│       ├── certificateVerification.integration.test.js
│       ├── cvDownloadAuth.test.js
│       ├── cvOcrPipeline.test.js
│       ├── cvParserPipeline.test.js
│       ├── cvReadinessRegression.test.js
│       ├── cvRecommendationLifecycle.test.js
│       ├── cvSkillExtraction.test.js
│       ├── dashboardRecommendations.test.js
│       ├── defaultResumeRegression.test.js
│       ├── deleteCv.test.js
│       ├── expiredJobLifecycle.test.js
│       └── resumeDownload.test.js
│
└── client/                               # React frontend (Vite)
    ├── package.json                      # Frontend dependencies
    ├── vite.config.js                    # Vite config with proxy to backend
    ├── tailwind.config.js                # Tailwind CSS config
    ├── postcss.config.js
    ├── index.html                        # SPA entry HTML
    │
    └── src/
        ├── main.jsx                      # React entry: Provider wraps App
        ├── App.jsx                       # Router: all routes defined
        │
        ├── pages/                        # React pages (60+)
        │   ├── Home.jsx
        │   ├── Jobs.jsx
        │   ├── JobDetails.jsx
        │   ├── auth/                     # Login, Register, ForgotPassword, ResetPassword, VerifyEmail, VerifyOTP
        │   ├── dashboard/
        │   │   ├── jobseeker/            # Dashboard, Profile, FindJobs, MyApplications, SavedJobs,
        │   │   │                         # ResumeBuilder, Messages, Settings, JobAlerts, InterviewDetails,
        │   │   │                         # CertificateVerification, SkillAssessment, CareerResources
        │   │   ├── employer/             # Dashboard, PostJob, ManageJobs, ViewApplicants, EmployerInterviews,
        │   │   │                         # EmployerMessages, EmployerSettings, CompanyProfile, InterviewDetails
        │   │   │   └── components/       # 13 interview sub-components
        │   │   └── admin/                # Dashboard, ManageUsers, ManageCompanies, ManageCategories,
        │   │                             # AdminApplications, AdminManageJobs, AdminMessages, AdminSettings,
        │   │                             # AdminReports, AdminProfile, AdminNotifications, CertificateVerifications,
        │   │                             # CreateCompany, UserProfile
        │   └── (other public pages)
        │
        ├── components/                   # Shared React components
        │   ├── AccessibilityPanel.jsx    # WCAG accessibility settings
        │   ├── SkipNavigation.jsx        # Screen reader skip link
        │   ├── DarkModeToggle.jsx        # Dark mode toggle
        │   ├── LanguageSwitcher.jsx      # EN/AM/OM language switcher
        │   ├── LoadingSkeleton.jsx       # Skeleton loaders
        │   ├── FileUpload.jsx            # Drag-and-drop file upload
        │   ├── KeyboardShortcutsGuide.jsx
        │   ├── ReadingGuide.jsx
        │   ├── Captions.jsx
        │   ├── DashboardBackground.jsx
        │   └── AdvancedFilters.jsx
        │
        ├── layouts/
        │   ├── MainLayout.jsx            # Public pages: Navbar + Footer + AccessibilityPanel
        │   ├── DashboardLayout.jsx       # Dashboard: Sidebar + Header + Outlet
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── Sidebar.jsx
        │   └── AdminHeaderActions.jsx
        │
        ├── services/                     # Frontend API layer
        │   ├── api.js                    # Axios instance with JWT interceptor
        │   ├── authService.js            # Auth API calls
        │   ├── resumeService.js          # Resume Builder API calls
        │   ├── messageService.js         # Messaging API calls
        │   ├── certificateService.js     # Certificate API calls
        │   ├── jobSearchService.js       # Saved searches + job alerts API
        │   └── socket.js                 # Socket.IO client singleton
        │
        ├── store/                        # Redux Toolkit
        │   ├── store.js                  # Store config with combineReducers
        │   └── slices/
        │       ├── authSlice.js          # Auth state (user, token, isAuthenticated)
        │       ├── jobSlice.js           # Jobs state
        │       ├── applicationSlice.js   # Applications state
        │       ├── employerSlice.js      # Employer state
        │       ├── adminSlice.js         # Admin state
        │       ├── notificationSlice.js  # Notifications state
        │       └── messagesSlice.js      # Messages unread count + online users
        │
        ├── context/
        │   └── AccessibilityContext.jsx   # WCAG 2.2 AA accessibility context
        │
        ├── hooks/
        │   ├── useAuth.js                # Auth helper hook
        │   └── useDebounce.js            # Debounce hook
        │
        ├── utils/
        │   ├── constants.js              # App-wide constants (regions, cities, job types, etc.)
        │   ├── helpers.js                # Frontend helpers (formatSalary, debounce, etc.)
        │   ├── resumeBuilderData.js      # Resume builder data helpers
        │   └── resumeCompletion.js       # Resume completion calculator
        │
        ├── constants/
        │   └── locations.js              # Ethiopian regions/cities data
        │
        ├── data/
        │   └── countryCodes.js           # International phone country codes
        │
        ├── i18n/
        │   ├── config.js                 # i18next setup (EN/AM/OM)
        │   └── locales/
        │       ├── en.json               # English translations (~2078 lines)
        │       ├── am.json               # Amharic translations
        │       └── om.json               # Oromo translations
        │
        └── resume-templates/             # 12 resume template components
            ├── config.js                 # Template definitions
            ├── templateUtils.js          # Template CSS + color tokens
            ├── index.js                  # Barrel exports
            ├── shared.css                # Shared resume CSS
            ├── AdditionalInfoSections.jsx
            ├── TemplateGallery.jsx, TemplateCard.jsx, TemplatePreviewModal.jsx
            ├── ModernATS.jsx, Professional.jsx, Minimal.jsx, Classic.jsx
            ├── Executive.jsx, Creative.jsx, Chrono.jsx, Elegant.jsx
            ├── Circular.jsx, Luxe.jsx, Casual.jsx, Horizontal.jsx
            └── (plus supporting UI: TemplateToolbar, TemplateFilter, etc.)
```

---

# PART 2 — FILE CONNECTION GRAPHS

## CONNECTION GRAPH: User Registration

```
User fills form → clicks Register
↓
client/src/pages/auth/Register.jsx
  (collects firstName, lastName, email, password, role, phone, companyName)
↓
dispatch(register(userData)) → Redux authSlice
↓
POST /api/auth/register
↓
backend/routes/authRoutes.js
  (authLimiter → registerValidator → validate)
↓
backend/controllers/authController.js → register()
  (validates role, checks duplicate email, hashes password with bcrypt)
  (creates User document in MongoDB)
  (generates email verification token)
  (sends verification email via config/email.js)
  (generates JWT access + refresh tokens)
  (sends token response via utils/jwt.js → sendTokenResponse())
↓
MongoDB stores User document
↓
Response: { accessToken, refreshToken, user }
↓
Redux authSlice stores user + token
  localStorage.setItem('token', accessToken)
  localStorage.setItem('user', JSON.stringify(user))
↓
React navigates to /verify-email
```

## CONNECTION GRAPH: User Login

```
User fills form → clicks Login
↓
client/src/pages/auth/Login.jsx
↓
dispatch(login({ email, password }))
↓
POST /api/auth/login
↓
backend/routes/authRoutes.js (authLimiter → loginValidator → validate)
↓
backend/controllers/authController.js → login()
  (finds User by email, compares password via bcrypt)
  (generates JWT tokens)
↓
Response: { accessToken, user }
↓
Redux authSlice stores user + token in state + localStorage
↓
React redirects by role:
  jobseeker → /dashboard
  employer → /employer
  admin → /admin
```

## CONNECTION GRAPH: Job Application

```
Job seeker clicks "Apply" on a job
↓
client/src/pages/JobDetails.jsx
  (opens Apply modal, selects resume file)
↓
api.post('/applications', formData)
  (includes: jobId, coverLetter, resume file, screeningAnswers)
↓
backend/routes/applicationRoutes.js
  (protect → requireEmailVerified → authorize('jobseeker') → uploadCV.single('resume'))
↓
backend/controllers/applicationController.js → applyJob()
  (validates: no duplicate application)
  (uploads resume to Cloudinary)
  (calculates match score via utils/matching.js → calculateJobMatch())
  (creates Application document)
  (increments Job.applicantsCount)
  (creates notification for employer)
  (sends notification email)
↓
MongoDB stores Application document with matchScore
↓
Response: { success, data: application }
↓
React shows success toast, updates UI
```

## CONNECTION GRAPH: Job Recommendations

```
Job seeker opens dashboard
↓
client/src/pages/dashboard/jobseeker/Dashboard.jsx
  OR
  client/src/pages/Jobs.jsx → GET /api/jobs/recommendations
↓
GET /api/jobs/recommendations
↓
backend/controllers/jobController.js → getRecommendations()
↓
backend/utils/dashboardHelpers.js → getRecommendationSourceAndProfile(user)
  (determines data source priority: Resume Builder > Profile > CV upload)
  (loads default Resume document if exists)
  (enriches user profile from resume via enrichUserFromResume())
↓
backend/utils/matching.js → calculateJobMatch(job, user, source)
  (for each active+approved job, calculates score):
    skillScore * 0.40 + experienceScore * 0.25 + titleScore * 0.15 +
    educationScore * 0.10 + locationScore * 0.10
↓
Returns sorted recommendations with scores
↓
Redux/React displays recommended jobs with match percentages
```

## CONNECTION GRAPH: Messaging

```
Employer sends message to job seeker
↓
client/src/pages/dashboard/employer/EmployerMessages.jsx
  (or jobseeker Messages.jsx — same shared component)
↓
messageService.sendMessage({ receiverId, content })
↓
POST /api/messages
↓
backend/routes/messageRoutes.js (protect → requireEmailVerified)
↓
backend/controllers/messageController.js → sendMessage()
  (creates Conversation if new thread)
  (creates Message document)
  (updates Conversation.lastMessage)
  (creates Notification for recipient)
  (sends email alert)
  (emits Socket.IO event via config/socket.js → sendMessageToChat/sendMessageToUser)
↓
MongoDB stores Message + updates Conversation
↓
Socket.IO delivers real-time to recipient
↓
Recipient's Messages.jsx receives event, updates UI instantly
```

---

# PART 3 — FRONTEND FILE-BY-FILE EXPLANATION

## Pages

### auth/Login.jsx
- **Route:** `/login`
- **Purpose:** User authentication form
- **State:** email, password, showPassword, country code selector
- **Redux:** `authSlice` (login thunk)
- **API:** POST /api/auth/login
- **Features:** Password visibility toggle, Google OAuth button, country code selector
- **Navigation:** On success → redirects by role (jobseeker→/dashboard, employer→/employer, admin→/admin)

### auth/Register.jsx
- **Route:** `/register`
- **Purpose:** New user registration
- **State:** formData (firstName, lastName, email, password, confirmPassword, role, phone, companyName, skills)
- **Redux:** `authSlice` (register thunk)
- **API:** POST /api/auth/register
- **Features:** Role toggle (jobseeker/employer), Google OAuth, company name for employers, skills for jobseekers
- **Navigation:** On success → /verify-email

### Home.jsx
- **Route:** `/`
- **Purpose:** Landing page
- **Features:** Hero section, featured jobs, popular categories, top companies, statistics, testimonials, newsletter, CTA
- **API:** None directly (static content)
- **Components used:** AnimatedSearch, FeaturedJobs, LatestJobs, PopularCategories, TopCompanies, Statistics, Newsletter, Testimonials, CTA, FAQ, CareerBlog, SuccessStories

### Jobs.jsx
- **Route:** `/jobs`
- **Purpose:** Job listing with advanced search and filters
- **State:** jobs[], filters, searchQuery, currentPage, selectedJob, savedJobs (Set), showApplyModal
- **API:** GET /api/jobs (with filter params), POST /api/bookmarks, DELETE /api/bookmarks/:id, POST /applications (inline apply)
- **Features:** Multi-filter panel, pagination, bookmark toggle, inline apply with file upload, share functionality

### JobDetails.jsx
- **Route:** `/jobs/:id`
- **Purpose:** Single job detail view
- **State:** job, isBookmarked, showApplyModal, showShareModal, showMessageModal
- **API:** GET /api/jobs/:id, POST /bookmarks, DELETE /bookmarks/:id
- **Features:** Full job description, company info, similar jobs, apply modal, share, message employer

### dashboard/jobseeker/Dashboard.jsx
- **Route:** `/dashboard`
- **Purpose:** Job seeker overview
- **API:** GET /applications/my, /bookmarks, /interviews/my, /notifications
- **Features:** Stats cards (applications, bookmarks, interviews, notifications), recent applications, upcoming interviews
- **Real-time:** Socket.IO listeners for applicationUpdate, interviewUpdate, notification

### dashboard/jobseeker/Profile.jsx
- **Route:** `/dashboard/profile`
- **Purpose:** Edit job seeker profile
- **API:** GET/PUT /users/profile, POST /users/profile/avatar, DELETE /users/profile/avatar
- **Features:** Sections for personal info, skills (tag input), experience (add/remove entries), education (add/remove), avatar upload (dropzone)

### dashboard/jobseeker/ResumeBuilder.jsx
- **Route:** `/dashboard/resume-builder`
- **Purpose:** Create and manage resumes
- **Service:** resumeService (CRUD operations)
- **API:** GET/POST/PUT/DELETE /api/resumes, PATCH /api/resumes/:id/default
- **Features:** Multi-step wizard (5 steps), template selection, live preview, default resume management

### dashboard/jobseeker/Messages.jsx
- **Route:** `/dashboard/messages`
- **Purpose:** Real-time messaging
- **Service:** messageService
- **API:** GET/POST/PATCH/DELETE /api/messages/*
- **Features:** Conversation list, message threads, new conversation search, file attachments, emoji, edit/delete messages, archive, read/unread, typing indicators via Socket.IO

### dashboard/employer/PostJob.jsx
- **Route:** `/employer/post-job`
- **Purpose:** Create job posting
- **API:** POST /api/jobs
- **Features:** Multi-step form (3 steps), react-hook-form validation, Ethiopian regions/cities, salary range, skill tags, application deadline

### dashboard/employer/EmployerInterviews.jsx
- **Route:** `/employer/interviews`
- **Purpose:** Full interview lifecycle management
- **API:** GET/PUT /api/interviews/*, POST /api/interviews/:id/evaluation
- **Features:** 13 sub-components for complete flow: PreInterviewLobby → InterviewRoom → FinishInterview → InterviewEvaluation → InterviewSummary, plus HiringDecisionHub, InterviewRoundProgress

### admin/Dashboard.jsx
- **Route:** `/admin`
- **Purpose:** Admin overview with charts
- **Redux:** adminSlice (fetchAdminStats)
- **API:** GET /admin/dashboard/stats, /admin/pending-jobs, /admin/pending-certifications
- **Features:** Stats cards, line chart (chart.js), pending jobs/certificates counts

### admin/ManageUsers.jsx
- **Route:** `/admin/users`
- **Purpose:** User management
- **Redux:** adminSlice (fetchAdminUsers, updateUserStatus)
- **Features:** Search, role/status filters, suspend/activate users, pagination

### admin/ManageCompanies.jsx
- **Route:** `/admin/companies`
- **Purpose:** Company approval workflow
- **Redux:** adminSlice (fetchAdminCompanies, approveCompany, rejectCompany, verifyCompany)
- **Features:** Search, status/verification filters, approve/reject/verify actions, document preview modal

### admin/AdminManageJobs.jsx
- **Route:** `/admin/jobs`
- **Purpose:** Job moderation
- **Redux:** adminSlice (fetchAdminJobs, approveAdminJob, rejectAdminJob)
- **Features:** Search, status/type filters, approve/reject job postings

---

# PART 4 — FRONTEND SERVICES

### services/api.js
- **Purpose:** Axios instance with interceptors
- **Base URL:** `VITE_API_URL` or `/api`
- **Request interceptor:** Attaches JWT from localStorage as Bearer token
- **Response interceptor:** On 401 → clears localStorage, redirects to /login with toast
- **Used by:** ALL other services and direct API calls throughout the app

### services/authService.js
- `register(data)` → POST /api/auth/register
- `login(credentials)` → POST /api/auth/login
- `logout()` → POST /api/auth/logout
- `getMe()` → GET /api/auth/me (used by authSlice initializeAuth)
- `updateProfile(data)` → PUT /api/auth/update-profile
- `uploadCV(formData)` → PUT /api/auth/upload-cv (multipart)
- `uploadAvatar(formData)` → PUT /api/auth/upload-avatar (multipart)

### services/resumeService.js
- `getResumes()` → GET /api/resumes
- `getResume(id)` → GET /api/resumes/:id
- `createResume(data)` → POST /api/resumes
- `updateResume(id, data)` → PUT /api/resumes/:id
- `deleteResume(id)` → DELETE /api/resumes/:id
- `syncResumeProfile(id)` → POST /api/resumes/:id/sync-profile
- `setDefaultResume(id)` → PATCH /api/resumes/:id/default

### services/messageService.js
- `getConversations()` → GET /api/messages
- `getMessages(conversationId)` → GET /api/messages/:id/messages
- `sendMessage(payload)` → POST /api/messages
- `updateMessage(messageId, content)` → PATCH /api/messages/:id
- `deleteMessage(messageId)` → DELETE /api/messages/:id
- `searchRecipients(params)` → GET /api/messages/recipients
- `uploadAttachment(file)` → POST /api/messages/upload (multipart)
- `markConversationRead(id)` → PATCH /api/messages/conversations/:id/read
- `markConversationUnread(id)` → PATCH /api/messages/conversations/:id/unread
- `toggleArchiveConversation(id)` → PATCH /api/messages/conversations/:id/archive
- `getUnreadMessagesCount()` → GET /api/messages/unread/count

### services/certificateService.js
- `uploadAndVerify(formData, onProgress)` → POST /api/certificates/verify (multipart with progress)
- `getMyVerifications(params)` → GET /api/certificates/my
- `getMyVerification(id)` → GET /api/certificates/my/:id
- `checkByNumber(verificationNumber)` → POST /api/certificates/check
- `adminGetVerifications(params)` → GET /api/admin/certificates
- `adminGetVerification(id)` → GET /api/admin/certificates/:id
- `adminReview(id, payload)` → PUT /api/admin/certificates/:id/review
- `adminSuspendUser(id)` → PUT /api/admin/certificates/:id/suspend-user

### services/jobSearchService.js
- `getSavedSearches()` → GET /api/saved-searches
- `createSavedSearch(payload)` → POST /api/saved-searches
- `updateSavedSearch(id, payload)` → PUT /api/saved-searches/:id
- `deleteSavedSearch(id)` → DELETE /api/saved-searches/:id
- `toggleSavedSearchNotification(id)` → PATCH /api/saved-searches/:id/toggle-notification
- `getJobAlerts()` → GET /api/job-alerts
- `createJobAlert(payload)` → POST /api/job-alerts
- `updateJobAlert(id, payload)` → PUT /api/job-alerts/:id
- `deleteJobAlert(id)` → DELETE /api/job-alerts/:id
- `getJobAlertNotifications(params)` → GET /api/notifications?type=new_job

### services/socket.js
- **Type:** Socket.IO client singleton (SocketService class)
- **Events emitted:** join-chat, leave-chat, send-message, typing, mark-read
- **Events listened:** new-message, message-received, message-updated, message-deleted, user-typing, message-read, online-users
- **Used by:** Messages.jsx, Dashboard.jsx (both jobseeker and employer)

---

# PART 5 — STATE MANAGEMENT

## Redux Toolkit Store

**Store location:** `client/src/store/store.js`

**Slices:**
| Slice | State | Key Actions |
|-------|-------|-------------|
| `auth` | user, token, isAuthenticated, loading, error | register, login, googleLogin, initializeAuth, logout, updateProfile, uploadCV, uploadAvatar, deleteAvatar, deleteCV, updateSettings, updatePassword |
| `jobs` | jobs[], job, loading, error, pagination, filters | fetchJobs, fetchJobById |
| `applications` | applications[], application, loading, error, pagination | fetchMyApplications, withdrawApplication |
| `employer` | company, jobs, applications, dashboardStats, loading, error, pagination | fetchEmployerDashboard, fetchEmployerCompany, resubmitCompany, fetchEmployerJobs, fetchEmployerApplications |
| `admin` | stats, users, companies, jobs, categories, loading, error, pagination | fetchAdminStats, fetchAdminUsers, fetchAdminUser, updateUserStatus, fetchAdminCompanies, fetchAdminJobs, approveAdminJob, rejectAdminJob, approveCompany, rejectCompany, verifyCompany, createCategory, updateCategory, deleteCategory |
| `notifications` | notifications[], unreadCount, loading, error, pagination | fetchNotifications, getUnreadCount, markAsRead, markAllAsRead, addNotification |
| `messages` | unreadCount, onlineUsers, loading | fetchUnreadCount, setOnlineUsers |

**Logout behavior:** On `auth/logout/fulfilled`, the entire Redux state is reset to `undefined`, which clears all slices.

## LocalStorage Persistence
- `token` — JWT access token
- `user` — Serialized user object
- `ethiojob_resumes` — Resume cache
- `selectedLanguage` — i18n language preference
- Dark mode preference (in DarkModeToggle component)

## Zustand
Zustand is listed in package.json but **no meaningful usage was found** in any source file. All state management is handled through Redux Toolkit.

---

# PART 6 — BACKEND ARCHITECTURE

## server/index.js

The entry point wires everything together:

1. **Express initialization** with JSON body parser (10mb limit)
2. **CORS** configured for CLIENT_URL with credentials
3. **Cookie parser** middleware
4. **Morgan** request logging (dev mode)
5. **MongoDB connection** via config/db.js
6. **Socket.IO** initialized via config/socket.js
7. **Route mounting** — all 20 route files mounted under /api/* prefixes
8. **Global error handler** via middleware/errorHandler.js
9. **HTTP server** listening on PORT

## Route Mounting Map (from index.js)

| Prefix | Route File |
|--------|-----------|
| /api/auth | authRoutes.js |
| /api/jobs | jobRoutes.js |
| /api/applications | applicationRoutes.js |
| /api/companies | companyRoutes.js |
| /api/admin | adminRoutes.js |
| /api/dashboard | dashboardRoutes.js |
| /api/employer | employerRoutes.js |
| /api/messages | messageRoutes.js |
| /api/interviews | interviewRoutes.js |
| /api/certificates | certificateRoutes.js |
| /api/resumes | resumeRoutes.js |
| /api/notifications | notificationRoutes.js |
| /api/bookmarks | bookmarkRoutes.js |
| /api/reviews | reviewRoutes.js |
| /api/saved-searches | savedSearchRoutes.js |
| /api/job-alerts | jobAlertRoutes.js |
| /api/categories | categoryRoutes.js |
| /api/skills | skillRoutes.js |
| /api/stats | statsRoutes.js |
| /api/contact | contactRoutes.js |

---

# PART 7 — COMPLETE ROUTE → CONTROLLER CONNECTION

## Auth Routes (authRoutes.js) — 25 routes

| Method | Endpoint | Controller | Auth | Role | Body | Purpose |
|--------|----------|-----------|------|------|------|---------|
| POST | /api/auth/register | register | No | — | firstName, lastName, email, password, role, phone, companyName | Register new user |
| POST | /api/auth/login | login | No | — | email, password | Login |
| GET | /api/auth/verify-email/:token | verifyEmail | No | — | — | Verify email |
| POST | /api/auth/verify-otp | verifyOTP | No | — | email, otp | Verify OTP |
| POST | /api/auth/send-otp | sendOTP | No | — | email | Send OTP |
| POST | /api/auth/forgot-password | forgotPassword | No | — | email | Request password reset |
| POST | /api/auth/reset-password | resetPasswordWithOTP | No | — | email, code, newPassword | Reset password |
| POST | /api/auth/refresh-token | refreshToken | No | — | refreshToken | Refresh access token |
| POST | /api/auth/google | googleLogin | No | — | idToken | Google OAuth |
| POST | /api/auth/github | githubLogin | No | — | code | GitHub OAuth |
| GET | /api/auth/me | getMe | Yes | — | — | Get current user |
| POST | /api/auth/logout | logout | Yes | — | — | Logout |
| POST | /api/auth/resend-verification | resendVerification | Yes | — | — | Resend email verification |
| POST | /api/auth/request-email-change | requestEmailChange | Yes | — | newEmail | Request email change |
| POST | /api/auth/confirm-email-change | confirmEmailChange | Yes | — | otp | Confirm email change |
| PUT | /api/auth/update-password | updatePassword | Yes | — | currentPassword, newPassword | Change password |
| PUT | /api/auth/update-profile | updateProfile | Yes | — | profile fields | Update profile |
| PUT | /api/auth/update-settings | updateSettings | Yes | — | settings object | Update settings |
| PUT | /api/auth/deactivate-account | deactivateAccount | Yes | — | — | Deactivate account |
| DELETE | /api/auth/delete-account | deleteAccount | Yes | — | — | Delete account |
| PUT | /api/auth/upload-avatar | uploadAvatar | Yes | — | avatar file | Upload avatar |
| DELETE | /api/auth/upload-avatar | deleteAvatar | Yes | — | — | Delete avatar |
| PUT | /api/auth/upload-cv | uploadCV | Yes | — | cv file | Upload CV |
| DELETE | /api/auth/upload-cv | deleteCV | Yes | — | — | Delete CV |
| POST | /api/auth/upload-certificate | uploadCertificate | Yes | — | certificate file | Upload certificate |

## Job Routes (jobRoutes.js) — 10 routes

| Method | Endpoint | Controller | Auth | Role | Purpose |
|--------|----------|-----------|------|------|---------|
| GET | /api/jobs | getJobs | Optional | — | List/search jobs |
| GET | /api/jobs/recommendations | getRecommendations | Yes | — | Get job recommendations |
| GET | /api/jobs/stats/overview | getJobStats | No | — | Job statistics |
| GET | /api/jobs/my/posted | getMyJobs | Yes | employer/admin | Employer's posted jobs |
| GET | /api/jobs/:id/similar | getSimilarJobs | No | — | Similar jobs |
| GET | /api/jobs/:id | getJob | Optional | — | Single job detail |
| POST | /api/jobs | createJob | Yes | employer/admin | Create job |
| PUT | /api/jobs/:id | updateJob | Yes | employer/admin | Update job |
| DELETE | /api/jobs/:id | deleteJob | Yes | employer/admin | Delete job |
| PUT | /api/jobs/:id/close | closeJob | Yes | employer/admin | Close job |

## Application Routes (applicationRoutes.js) — 13 routes

| Method | Endpoint | Controller | Auth | Role | Purpose |
|--------|----------|-----------|------|------|---------|
| POST | /api/applications | applyJob | Yes | jobseeker | Apply to job |
| GET | /api/applications/my | getMyApplications | Yes | jobseeker | My applications |
| PUT | /api/applications/:id/withdraw | withdrawApplication | Yes | jobseeker | Withdraw application |
| GET | /api/applications/employer | getEmployerApplications | Yes | employer/admin | Employer's applicants |
| PUT | /api/applications/:id/status | updateApplicationStatus | Yes | employer/admin | Update status |
| POST | /api/applications/:id/schedule-interview | scheduleInterviewForApplication | Yes | employer/admin | Schedule interview |
| PUT | /api/applications/:id/bookmark | bookmarkApplicant | Yes | employer/admin | Bookmark applicant |
| GET | /api/applications/:id/resume | downloadResume | Yes | employer/jobseeker/admin | Download resume |
| GET | /api/applications/employer/export | exportEmployerApplications | Yes | employer/admin | Export applications |
| PUT | /api/applications/:id/shortlist | shortlistApplicant | Yes | employer/admin | Shortlist |
| PUT | /api/applications/:id/hire | hireApplicant | Yes | employer/admin | Hire |
| PUT | /api/applications/:id/reject | rejectApplicant | Yes | employer/admin | Reject |
| GET | /api/applications/:id | getApplication | Yes | any | Get application |

## Admin Routes (adminRoutes.js) — 32 routes (ALL require admin role)

All admin routes are protected by `protect` + `authorize('admin')` applied at router level.

| Method | Endpoint | Controller | Purpose |
|--------|----------|-----------|---------|
| GET | /api/admin/dashboard/stats | getDashboardStats | Dashboard statistics |
| GET | /api/admin/dashboard/activity | getPlatformActivity | Platform activity |
| GET | /api/admin/reports | getReportsStats | Reports |
| GET | /api/admin/applications | getAdminApplications | All applications |
| DELETE | /api/admin/applications/:id | deleteApplication | Delete application |
| GET | /api/admin/users | getUsers | List users |
| GET | /api/admin/users/:id | getUserById | User detail |
| PUT | /api/admin/users/:id | updateUser | Update user |
| PATCH | /api/admin/users/:id/status | updateUserStatus | Change user status |
| PUT | /api/admin/users/:id/suspend | suspendUser | Suspend user |
| DELETE | /api/admin/users/:id | deleteUser | Delete user |
| GET | /api/admin/companies | getCompanies | List companies |
| PUT | /api/admin/companies/:id/approve | approveCompany | Approve company |
| PUT | /api/admin/companies/:id/reject | rejectCompany | Reject company |
| PUT | /api/admin/companies/:id/verify | verifyCompany | Verify company |
| PUT | /api/admin/companies/:id/feature | featureCompany | Feature company |
| GET | /api/admin/jobs | getJobs | List all jobs |
| PUT | /api/admin/jobs/:id/approve | approveJob | Approve job |
| PUT | /api/admin/jobs/:id/reject | rejectJob | Reject job |
| PUT | /api/admin/jobs/:id/feature | featureJob | Feature job |
| GET | /api/admin/categories | getCategories | List categories |
| POST | /api/admin/categories | createCategory | Create category |
| PUT | /api/admin/categories/:id | updateCategory | Update category |
| DELETE | /api/admin/categories/:id | deleteCategory | Delete category |
| GET | /api/admin/skills | getSkills | List skills |
| POST | /api/admin/skills | createSkill | Create skill |
| PUT | /api/admin/skills/:id | updateSkill | Update skill |
| DELETE | /api/admin/skills/:id | deleteSkill | Delete skill |
| GET | /api/admin/certificates | getAllVerifications | List verifications |
| GET | /api/admin/certificates/:id | getVerification | Verification detail |
| PUT | /api/admin/certificates/:id/review | reviewVerification | Review verification |
| PUT | /api/admin/certificates/:id/suspend-user | suspendUserForFraud | Suspend for fraud |

---

# PART 8 — DATABASE (MongoDB Models)

## User Model (models/user.js) — 241 lines

**Purpose:** Core user entity for all three roles.

**Key Fields:**
- Identity: `firstName`, `lastName`, `email` (unique), `password` (select:false)
- Role: `role` (enum: jobseeker/employer/admin, default: jobseeker)
- Status: `isActive`, `isSuspended`, `isEmailVerified`, `status` (pending/active/suspended/rejected)
- Profile: `avatar`, `avatarPublicId`, `phone`, `gender`, `headline`, `bio`, `currentRole`, `location`
- Skills: `skills[]` (ref Skill), `skillNames[]`, `technicalSkills[]`, `softSkills[]`
- Experience: `experience`, `experienceYears`, `experienceDetails[]`
- Education: `education[]`, `educationDetails[]`
- CV: `cv` (URL), `cvPublicId`, `cvOriginalName`, `cvVersion`, `cvDetachedAt`
- Resume Analysis: `resumeAnalysis` (skills, skillNames, education, experienceYears, location, certifications, professionalTitle, cvId, textSource, rawText)
- Preferences: `jobPreferences` (preferredJobTypes, industries, careerInterests, preferredLocation)
- Auth: `googleId`, `githubId`, `refreshTokens[]`, `emailVerificationToken`, `otpCode`, `resetPasswordToken`
- Settings: `settings.notifications` (email_alerts, in_app_notifications, job_match_alerts, etc.)
- Other: `languages[]`, `portfolio[]`, `certificates[]`, `profileViews`, `lastLogin`

**Hooks:** `pre('save')` — bcrypt password hashing
**Methods:** `comparePassword()`, `generateEmailVerificationToken()`, `generateOTP()`, `verifyOTP()`, `addRefreshToken()`, `generatePasswordResetToken()`, `calculateProfileCompleteness()`

## Job Model (models/job.js) — 181 lines

**Purpose:** Job postings created by employers.

**Key Fields:**
- Core: `title`, `slug` (unique), `description`, `requirements`, `responsibilities`, `benefits[]`
- Skills: `skills.technical[]`, `skills.soft[]`, `skillsRequired[]` (ref Skill)
- Relations: `company` (ref Company, required), `postedBy` (ref User, required), `category` (ref Category, required)
- Type: `jobType` (enum: Full-time/Part-time/Contract/Internship/Freelance/Temporary), `workMode` (On-site/Remote/Hybrid), `experienceLevel`, `educationRequired`
- Salary: `salary.min`, `salary.max`, `salary.currency` (default ETB), `salary.period`, `salary.isNegotiable`
- Location: `location.region` (required), `location.city`, `location.address`
- Status: `status` (pending/published/active/draft/closed/expired/paused), `isApproved` (default false)
- Deadline: `applicationDeadline` (required)
- Custom fields: `applicationFields[]` (for employer-configured screening questions)
- Stats: `views`, `applicantsCount`, `bookmarksCount`
- Flags: `isFeatured`, `isUrgent`, `isRemote`
- Accessibility: `accessibility.disabilityFriendly`, `accessibility.accommodations`

**Hooks:** `pre('save')` — generates slug, auto-expire/reactivate based on deadline
**Virtuals:** `isExpired`, `daysRemaining`
**Indexes:** text search on title/description/requirements, compound indexes for filtering

## Application Model (models/Application.js) — 90 lines

**Purpose:** Records when a job seeker applies to a job.

**Key Fields:**
- Relations: `job` (ref Job), `applicant` (ref User), `company` (ref Company), `employer` (ref User)
- Content: `coverLetter`, `resumeUrl`, `resumePublicId`, `useProfileCV`
- Score: `matchScore` (default 0)
- Screening: `screeningAnswers[]` (fieldId, question, answer)
- Status: `status` (enum: Submitted/Reviewed/Shortlisted/Interview/Interview Scheduled/Interview Completed/Interview Cancelled/Rejected/Selected/Not Selected/Hired/withdrawn)
- History: `statusHistory[]` (status, note, changedBy, changedAt)
- Links: `portfolioUrl`, `githubUrl`, `linkedinUrl`, `expectedSalary`

**Unique index:** `{ job: 1, applicant: 1 }` — one application per job

## Company Model (models/Company.js) — 128 lines

**Purpose:** Employer company profiles.

**Key Fields:**
- Identity: `name` (unique), `slug` (unique), `description`, `tagline`
- Media: `logo`, `coverImage`, `businessLicense`, `tinCertificate`, `companyRegistration`
- Business: `industry`, `companySize` (enum), `companyType` (enum), `foundedYear`
- Contact: `website`, `email`, `phone`
- Location: `location.region/city/address/coordinates`
- Social: `socialLinks.linkedin/facebook/telegram/instagram`
- Relations: `owner` (ref User, required), `employees[]` (ref User)
- Status: `isVerified`, `isApproved`, `isActive`, `isFeatured`
- Stats: `totalJobs`, `totalHires`, `averageRating`, `totalReviews`

**Hooks:** `pre('save')` — generates slug from name

## Resume Model (models/Resume.js) — 70 lines

**Purpose:** Resume Builder documents created by job seekers.

**Key Fields:**
- Relations: `user` (ref User, required)
- Template: `template` (default: 'modern-ats'), `theme`
- Content: `profile`, `summary`, `experience[]`, `education[]`, `projects[]`, `skills[]`, `softSkills[]`, `languages[]`, `certifications[]`, `interests`, `photo`
- Custom sections: `sectionOrder[]`, `dirtyFields[]`
- Flag: `isDefault` (boolean — only one default per user)

**Hooks:** `pre('save')` — auto-promotes to default if first resume for user
**Indexes:** `{ user: 1, isDefault: 1 }` (sparse)

## Other Models

**Conversation/Message** — Two-party conversations with messages supporting text/file/image, soft delete, read receipts
**Interview** — Scheduled interviews with status flow: scheduled → confirmed → completed, result: pass/fail/pending/hold
**CertificateVerification** — Verification attempts with extracted/declared/trusted data, score, status (VERIFIED/SUSPICIOUS/INVALID/PENDING_REVIEW)
**VerifiedCertificate** — Trusted certificate database for known institutions
**Notification** — In-app notifications with type enum (23 types), read status, unique index prevents duplicate new_job notifications
**Bookmark** — User→Job bookmarks (unique compound index)
**Review** — Company reviews with sub-ratings, auto-updates Company averageRating via post('save') hook
**SavedSearch** — Saved search filters per user
**JobAlert** — Recurring job alerts with frequency (daily/weekly/monthly)
**Category** — Job categories with self-referencing parent field
**Skill** — Skills registry

---

# PART 9 — DATABASE RELATIONSHIP MAP

```
User (jobseeker)
├── creates Resume(s) [Resume.user → User._id]
├── creates Application(s) [Application.applicant → User._id]
├── owns Bookmark(s) [Bookmark.user → User._id]
├── owns SavedSearch(es) [SavedSearch.user → User._id]
├── owns JobAlert(s) [JobAlert.user → User._id]
├── creates Review(s) [Review.reviewer → User._id]
├── uploads CertificateVerification(s) [CertificateVerification.user → User._id]
├── participates in Conversation(s) [Conversation.participants → User._id]
├── sends/receives Message(s) [Message.sender/receiver → User._id]
├── has Interview(s) [Interview.applicant → User._id]
├── receives Notification(s) [Notification.recipient → User._id]
├── has skills [User.skills[] → Skill._id]
└── uploads CV (Cloudinary URL)

User (employer)
├── owns Company [Company.owner → User._id]
├── creates Job(s) [Job.postedBy → User._id]
├── receives Application(s) [Application.employer → User._id]
├── schedules Interview(s) [Interview.employer → User._id]
└── receives Notification(s) [Notification.recipient → User._id]

User (admin)
├── reviews Company(s) [Company.reviewedBy → User._id]
├── reviews CertificateVerification(s) [CertificateVerification.reviewedBy → User._id]
└── creates Notification(s) [Notification.sender → User._id]

Company
├── has Job(s) [Job.company → Company._id]
├── has Review(s) [Review.company → Company._id]
├── has employees [Company.employees[] → User._id]
└── has Application(s) [Application.company → Company._id]

Job
├── belongs to Company [Job.company → Company._id]
├── posted by User [Job.postedBy → User._id]
├── has Application(s) [Application.job → Job._id]
├── has Bookmark(s) [Bookmark.job → Job._id]
├── belongs to Category [Job.category → Category._id]
├── requires Skill(s) [Job.skillsRequired[] → Skill._id]
└── has Interview(s) [Interview.job → Job._id]

Application
├── links Job and User
├── has statusHistory[].changedBy → User._id
└── has Interview(s) [Interview.application → Application._id]

CertificateVerification
├── belongs to User [CertificateVerification.user → User._id]
├── references VerifiedCertificate [CertificateVerification.certificate → VerifiedCertificate._id]
└── may reference duplicate User [CertificateVerification.duplicateOfUser → User._id]
```

---

# PART 10 — AUTHENTICATION FLOW

## Registration
1. React `Register.jsx` → dispatch `register(userData)`
2. `POST /api/auth/register` → authController.register()
3. Validates email uniqueness
4. Hashes password with bcrypt (salt rounds 10) via User model `pre('save')` hook
5. Creates User document with `role` (jobseeker or employer)
6. If employer: creates Company record linked to user
7. Generates email verification token via `user.generateEmailVerificationToken()`
8. Sends verification email via Brevo/SMTP
9. Generates JWT access token (7d) + refresh token (30d)
10. Returns tokens + user data

## Email Verification
1. User clicks link: `/verify-email/:token`
2. `GET /api/auth/verify-email/:token` → authController.verifyEmail()
3. Hashes token, finds user by `emailVerificationToken` + expiry check
4. Sets `isEmailVerified = true`, clears token fields

## OTP Flow (Password Reset)
1. `POST /api/auth/send-otp` → authController.sendOTP()
2. Generates 6-digit OTP via `user.generateOTP()` (hashed with SHA-256, stored with expiry from OTP_EXPIRE_MINUTES)
3. Sends OTP via email
4. User enters OTP at `/verify-otp` → `POST /api/auth/verify-otp` → authController.verifyOTP()
5. `user.verifyOTP(code)` checks hash match + expiry
6. On success, navigates to `/reset-password`
7. `POST /api/auth/reset-password` → authController.resetPasswordWithOTP()
8. Updates password, clears OTP fields

## Google OAuth
1. React `GoogleOAuth` component gets Google ID token
2. `POST /api/auth/google` → authController.googleLogin()
3. Verifies token via `google-auth-library`
4. Finds or creates User by `googleId`
5. Returns JWT tokens

## JWT Tokens
- Access token: signed with `JWT_SECRET`, expires per `JWT_EXPIRE` (default 7d)
- Refresh token: signed with `JWT_REFRESH_SECRET`, expires per `JWT_REFRESH_EXPIRE` (default 30d)
- Tokens sent as JSON response (also in httpOnly cookie in production)
- Stored in localStorage as `token`

## Protected Routes
- `middleware/auth.js` → `protect` middleware
- Extracts token from `Authorization: Bearer <token>` header
- Verifies JWT, loads user from DB
- Checks: user exists, not suspended, not rejected, email verified (in production)
- Attaches `req.user`
- `authorize('role')` middleware checks role-based access

## Password Hashing
- bcrypt with salt rounds 10
- Applied via Mongoose `pre('save')` hook (only when password field is modified)

---

# PART 11 — MATCHING SYSTEM (CRITICAL FOR DEMO)

## How the Matching Algorithm Works

**File:** `backend/utils/matching.js` (537 lines)

**IMPORTANT:** This is a **rule-based weighted algorithmic matching system**, NOT machine learning. It uses hand-crafted scoring weights.

### Data Input
For each job-user pair, the algorithm receives:
- **Job data:** title, description, skills (technical + soft), experienceLevel, educationRequired, location, jobType
- **User data:** headline, currentRole, skills, softSkills, experienceYears, education, certificates, location

### Score Formula

```
totalScore = round(
    combinedSkillScore * 0.40 +    // 40% weight
    experienceScore   * 0.25 +    // 25% weight
    titleScore        * 0.15 +    // 15% weight
    educationScore    * 0.10 +    // 10% weight
    locationScore     * 0.10      // 10% weight
)
```

Where:
- `combinedSkillScore = round(skillScore * 0.85 + certificationScore * 0.15)`

### Component Details

#### 1. Skill Score (40% of total, 85% of combined skill score)
- Extracts user skills from: `user.technicalSkills` → `user.skills` → `user.skillNames`
- Also extracts tokens from user headline and bio (words > 2 chars)
- Normalizes skill names: `react.js`→`react`, `node.js`→`node`, `typescript`→`ts`, etc.
- If job has explicit skills:
  - For each job skill, checks exact normalized match, then fuzzy containment (both names >= 3 chars)
  - `matchRatio = matchedSkills.length / jobSkills.length`
  - `baseScore = round(matchRatio * 100)`
- If job has NO explicit skills: scores against job title/description text
- **Soft skill bonus:** +0 to +5 points based on `job.skills.soft[]` vs `user.softSkills[]` match ratio
- `skillScore = min(100, baseScore + softBonus)`

#### 2. Experience Score (25% of total)
- User years derived from: `user.experienceYears` → `user.experienceDetails.length` → 1 if `user.experience` exists → 0
- Required years from `experienceLevel` mapping:
  - entry=0, mid=2, senior=5, lead=8, manager=10, director=12, executive=15
- If required=0: score=100; if user>=required: score=100; otherwise: `min(100, round(userYears/requiredYears * 100))`

#### 3. Title Score (15% of total)
- Tokenizes user headline/currentRole and job title (words > 2 chars)
- Counts substring matches of job title tokens in user title
- ratio >= 0.6 → 100; >= 0.33 → 70; > 0 → 40; else → 20
- No user title → 60; No job title → 100

#### 4. Education Score (10% of total)
- If no requirement: score=100
- Checks user educationDetails.degree/institution against keyword sets
- Match found: score=100; No match: score=30; No education data: score=40

#### 5. Location Score (10% of total)
- Remote job: score=100
- No user location: score=70
- No job location: score=100
- User location matches job city/region: score=100
- No match: score=30

#### 6. Certification Score (15% of combined skill score)
- If job requirements/description mention certification keywords (certificate, pmp, aws, cisco): score=20 if user has none, 100 if has any
- If no certification needed: score=100

### Score Range
- 0-100 (clamped)
- Recommendation threshold: jobs with score > 0 are returned, sorted descending
- The top results are shown as "Recommended for you"

### Recommendation Data Source Priority
**File:** `backend/utils/dashboardHelpers.js`

The system determines WHERE to get user profile data from (in priority order):
1. **Resume Builder document** (preferred) — looks up `Resume` model where `isDefault = true`
2. **User profile** (fallback) — uses profile fields directly
3. **CV upload** — **NOT used** for recommendations (the system prioritizes Resume Builder)

`getRecommendationSourceAndProfile(user)` → loads default resume → `enrichUserFromResume(user, resume)` → overlays resume data onto profile

This is why **changing your default resume changes your recommendations** — the matching algorithm uses whatever skills/experience/education are in that Resume Builder document.

---

# PART 12 — CV UPLOAD + PARSING PIPELINE

## Complete Pipeline

```
User uploads CV (PDF/DOCX)
↓
React: dispatch(uploadCV(formData)) → authSlice
↓
PUT /api/auth/upload-cv (multer single file)
↓
authController.uploadCV()
  1. Uploads file to Cloudinary (authenticated folder)
  2. Calls parseResumeSkills(resumeUrl) from utils/resumeParser.js
     ↓
     resumeParser.js pipeline:
     a. Downloads file via cloudinaryFile.js → fetchStoredFileBuffer()
     b. Detects file type (PDF/DOCX/text)
     c. PDF: pdfjs-dist extracts text (up to 30 pages)
        - If text < 32 chars → OCR fallback:
          1. pdf-to-img rasterizes pages at 3x scale
          2. @napi-rs/canvas preprocesses (grayscale → contrast stretch → binarize)
          3. tesseract.js runs OCR
          4. Fallback: extracts embedded XObject images from PDF
     d. DOCX: mammoth.extractRawText()
     e. Returns structured text
  3. From text, extracts:
     - Skills (matches against Skill DB collection or fallback list)
     - Experience years (regex: "X years")
     - Education (keyword matching)
     - Certifications (regex patterns)
     - Location (label matching)
     - Professional title (role pattern matching)
     - Languages (known language list matching)
     - Preferred job types
     - Industry
  4. Stores parsed data in user.resumeAnalysis
  5. Stores CV URL in user.cv, publicId in user.cvPublicId
↓
MongoDB: User document updated with cv, cvPublicId, resumeAnalysis
↓
Redux: authSlice stores updated user
```

---

# PART 13 — RESUME BUILDER

## Flow

```
Job seeker navigates to /dashboard/resume-builder
↓
ResumeBuilder.jsx loads
  → resumeService.getResumes() → GET /api/resumes
  → Shows list of saved resumes or empty state
↓
User creates new resume
  → Multi-step wizard (5 steps):
    Step 1: Personal info (name, title, email, phone, location, photo)
    Step 2: Summary
    Step 3: Experience entries (add/remove)
    Step 4: Education entries (add/remove)
    Step 5: Skills, certifications, languages, projects
  → User selects template from 12 options
  → resumeService.createResume(data) → POST /api/resumes
↓
Resume Controller (resumeController.js):
  → Validates data
  → Creates Resume document
  → If first resume: auto-promotes to isDefault=true
  → Returns created resume
↓
MongoDB: Resume document stored
```

## Default Resume Behavior
- First resume created is automatically set as default
- `setResumeAsDefault(userId, resumeId)` clears all `isDefault` flags, then sets one
- If default is deleted, next most recently updated resume is promoted
- The **default resume** is what the **recommendation engine** uses for matching

## Template System
12 templates defined in `client/src/resume-templates/config.js`:
ModernATS, Professional, Minimal, Classic, Executive, Creative, Chrono, Elegant, Circular, Luxe, Casual, Horizontal

Each template:
- Receives normalized view model via `getResumeViewModel(resume)`
- Uses shared CSS from `shared.css`
- Supports color themes via `getColorTokens()`

---

# PART 14 — CLOUDINARY INTEGRATION

## What is uploaded
| File Type | Upload Location | Who uploads | Controller |
|-----------|----------------|-------------|------------|
| User avatar | `avatars/` folder | Any user | authController.uploadAvatar() |
| User CV/Resume | `cvs/` folder (authenticated) | Any user | authController.uploadCV() |
| Company logo | `companies/logos/` | Employer | companyController.uploadLogo() |
| Company cover | `companies/covers/` | Employer | companyController.createCompany() |
| Company documents | `companies/documents/` | Employer | companyController.createCompany() |
| Application resume | `applications/` folder | Job seeker | applicationController.applyJob() |
| Chat attachments | `chat/` folder | Any user | messageController.uploadAttachment() |
| Certificate files | `certificates/` folder | Job seeker | certificateController.uploadAndVerify() |

## How files are stored
- Cloudinary `multer-storage-cloudinary` configured in `config/cloudinary.js`
- Each upload type has its own multer middleware factory (e.g., `avatarUpload`, `cvUpload`, `uploadCert`)
- Files stored in Cloudinary with public IDs

## How files are downloaded
- **Public files** (avatars, logos): direct Cloudinary delivery URLs
- **Authenticated files** (CVs): `utils/cloudinaryFile.js` → `fetchStoredFileBuffer()` uses signed URLs via `cloudinary.utils.api_sign_request()`
  - Strategy: direct URL first → signed URL fallback on 401/403

---

# PART 15 — EMAIL SYSTEM

## Dual Transport
**File:** `config/email.js`

1. **Primary: Brevo HTTPS API** — used when `EMAIL_PROVIDER=https` (required on Render free tier)
2. **Fallback: SMTP/Nodemailer** — used when `EMAIL_PROVIDER=smtp` (local development)

## Email Types Sent
| Type | Trigger | Template |
|------|---------|----------|
| Email verification | Registration | verification email with token link |
| OTP | Password reset | OTP code in email body |
| Password reset confirmation | Password reset | confirmation |
| Application received | Job application | notification to employer |
| Application status update | Status change | notification to applicant |
| Interview scheduled | Interview creation | notification to applicant |
| New message | Message sent | notification to recipient |
| Job match alert | New job matching preferences | notification to job seekers |
| Contact form | Contact page submission | email to admin (via emailService.js) |

---

# PART 16 — SOCKET.IO REAL-TIME

## Server Setup (config/socket.js)
- Socket.IO initialized with CORS for CLIENT_URL
- **Auth middleware:** Verifies JWT from `socket.handshake.auth.token`
- Loads user from DB, attaches `socket.userId` and `socket.userRole`
- Tracks connected users in `userSocketMap` (Map<userId, socketId>)

## Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| join-chat | Client→Server | Join conversation room |
| leave-chat | Client→Server | Leave conversation room |
| send-message | Client→Server→Room | Send message to conversation |
| typing | Client→Server→Room | Typing indicator |
| mark-read | Client→Server→Room | Read receipt |
| new-message | Server→Room | Broadcast message to conversation |
| message-received | Server→User | Personal notification of new message |
| message-updated | Server→Room | Broadcast message edit |
| message-deleted | Server→Room | Broadcast message delete |
| user-typing | Server→Room | Typing indicator broadcast |
| message-read | Server→Room | Read receipt broadcast |
| online-users | Server→All | List of all connected user IDs |

## Client Setup (services/socket.js)
- Singleton `SocketService` class
- Connects with JWT token in `auth` field
- Reconnection enabled (5 attempts, 1s delay)
- Used by: Messages.jsx (all roles), Dashboard.jsx (jobseeker/employer)

---

# PART 17 — NOTIFICATION SYSTEM

## Who Creates Notifications
The `createNotification()` function in `utils/helpers.js` is called by:
- `applicationController` — application status changes
- `jobController` — job creation (notifies admins)
- `messageController` — new message sent
- `interviewController` — interview scheduled/updated
- `certificateController` — verification events
- `adminController` — admin actions

## How They're Stored
- MongoDB `Notification` model
- Fields: recipient, sender, type (23 types), title, message, link, data, isRead, readAt

## Duplicate Prevention
- Unique sparse index: `{ recipient: 1, type: 1, 'data.jobId': 1 }` with `partialFilterExpression: { type: 'new_job' }`
- Prevents duplicate new_job notifications per jobseeker per job

## Real-time Updates
- `createNotification()` also calls `sendNotification(userId, notification)` from socket.js
- Frontend listens via Socket.IO and dispatches `addNotification()` to Redux

## Read/Unread
- Individual: `PUT /api/notifications/:id/read`
- All: `PUT /api/notifications/read-all`
- Count: `GET /api/notifications/unread/count`

---

# PART 18 — INTERVIEW SYSTEM

## Complete Flow
1. Employer clicks "Schedule Interview" from application
2. `POST /api/applications/:id/schedule-interview` → applicationController
3. Creates Interview document with: job, applicant, employer, company, scheduledDate, type, location/meetingLink
4. Updates Application status to 'Interview Scheduled'
5. Creates notification for applicant
6. Sends email notification

## Interview Status Flow
```
scheduled → confirmed → completed
    ↓           ↓           ↓
  cancelled   no_show     pass/fail
```

## Employer Interview UI (13 components)
1. `InterviewCard` — List card with status badges, action buttons
2. `InterviewDetailsModal` — Detail view modal
3. `PreInterviewLobby` — Pre-interview prep screen with checklist
4. `InterviewRoom` — Simulated video interview room
5. `LiveInterview` — Dark-themed live view
6. `FinishInterview` — Post-interview evaluation form
7. `InterviewEvaluation` — Enhanced evaluation with tag inputs
8. `InterviewSummary` — Post-evaluation success summary
9. `InterviewCompletedSummary` — Completed interview table
10. `InterviewRoundProgress` — Pipeline progress tracker
11. `HiringDecisionHub` — Final hiring decision cards
12. `EvaluationModal` — Quick assessment modal
13. `InterviewStatusComparison` — Side-by-side comparison

---

# PART 19 — CERTIFICATE VERIFICATION SYSTEM

## Complete Pipeline

```
Job seeker uploads certificate
↓
certificateService.uploadAndVerify(formData) → POST /api/certificates/verify
↓
certificateController.uploadAndVerify()
  1. Uploads file to Cloudinary
  2. Calls analyzeCertificateBuffer() from certificateParser.js:
     a. Detects file type via magic bytes (PDF/PNG/JPEG)
     b. PDF: extracts text via pdfjs-dist
     c. Image: decodes QR code via jsQR + pngjs/jpeg-js
     d. Extracts verification number from text patterns
     e. Extracts certificate fields (name, studentId, institution, program, etc.)
  3. Calls runVerification() from certificateVerification.js:
     a. Rule 5: No verification number → PENDING_REVIEW
     b. Looks up trusted record via VerifiedCertificate.findOne()
     c. Rule 3: No trusted record → INVALID
     d. Rule 4: Duplicate check (same cert number, different user)
     e. Rules 1/2: Field-by-field comparison against trusted record
     f. Profile consistency check (document vs account)
     g. Computes verification score via weighted scoring
  4. Stores CertificateVerification document
  5. Returns result to frontend
↓
Admin reviews SUSPICIOUS/PENDING_REVIEW certificates
  → PUT /api/admin/certificates/:id/review
  → Can mark as verified, rejected, or suspend user for fraud
```

## Verification Score Weights
| Field | Weight |
|-------|--------|
| certificateNumber | 25 |
| fullName | 20 |
| studentId | 10 |
| institution | 10 |
| program | 10 |
| certificateType | 5 |
| issueDate | 5 |
| graduationYear | 5 |
| email | 5 |
| phone | 5 |

---

# PART 20 — BOOKMARKS, SAVED SEARCHES, JOB ALERTS

## Bookmark
- **Purpose:** Save a job for later viewing
- **Model:** `{ user, job, note }` — unique compound index
- **API:** POST/DELETE/GET /api/bookmarks
- **Frontend:** Toggle button on job cards and detail pages

## Saved Search
- **Purpose:** Save filter criteria for reuse
- **Model:** `{ user, name, query, notifyOnNewJobs }`
- **API:** CRUD /api/saved-searches + toggle notification
- **Frontend:** Search filters → save as named search

## Job Alert
- **Purpose:** Recurring notifications for matching jobs
- **Model:** `{ user, title, region, city, jobType, keywords, active, frequency }`
- **API:** CRUD /api/job-alerts
- **Frontend:** Job Alerts page in dashboard

---

# PART 21 — INTERNATIONALIZATION

## Languages Supported
- **English (en)** — default, fallback
- **Amharic (am)** — Ethiopia's official language
- **Oromo (om)** — widely spoken Ethiopian language

## Configuration (i18n/config.js)
- Uses `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- Detection order: localStorage → navigator
- Storage key: `selectedLanguage`
- Fallback: English
- Missing key handler: converts camelCase key to human-readable text

## Translation Files
- `client/src/i18n/locales/en.json` (~2078 lines)
- Namespaces: common, nav, auth, home, jobs, dashboard, admin, sidebar, employer, company, etc.

## Language Persistence
- Stored in `localStorage.selectedLanguage`
- LanguageSwitcher component lets users switch

---

# PART 22 — ACCESSIBILITY

## Implemented Features (AccessibilityContext.jsx)
- **Font size:** adjustable
- **Font family:** selectable
- **High contrast mode:** toggle
- **Reduced motion:** toggle
- **Focus mode:** highlight focused elements
- **Reading guide:** horizontal ruler following mouse
- **Line spacing:** adjustable
- **Letter spacing:** adjustable
- **Cursor size:** adjustable
- **Screen reader mode:** toggle
- **Keyboard navigation guide:** overlay showing shortcuts
- **Color blind mode:** toggle
- **Skip navigation:** link for screen readers
- **Captions/transcript panel:** floating panel

## Components
- `AccessibilityPanel.jsx` (324 lines) — floating settings hub
- `SkipNavigation.jsx` — skip-to-content link
- `KeyboardShortcutsGuide.jsx` — keyboard shortcut overlay
- `ReadingGuide.jsx` — dyslexia/ADHD reading ruler
- `Captions.jsx` — transcript panel

---

# PART 23 — SECURITY

## Implemented
| Feature | Implementation | File |
|---------|---------------|------|
| Password hashing | bcrypt (salt rounds 10) | models/user.js pre('save') |
| JWT access tokens | Signed with JWT_SECRET, 7d expiry | utils/jwt.js |
| JWT refresh tokens | Signed with JWT_REFRESH_SECRET, 30d expiry, hashed storage | utils/jwt.js + models/user.js |
| CORS | Configured for CLIENT_URL with credentials | backend/index.js |
| Helmet | HTTP security headers | backend/index.js |
| MongoDB sanitization | express-mongo-sanitize | backend/index.js |
| XSS protection | xss-clean middleware | backend/index.js |
| Rate limiting | authLimiter (40/15min), passwordResetLimiter (10/60min), uploadLimiter (50/15min) | middleware/rateLimiter.js |
| Input validation | express-validator on register, login, password reset, job create, company create | middleware/validate.js |
| File upload limits | Multer file size limits via Cloudinary config | config/cloudinary.js |
| Role-based authorization | authorize('role') middleware | middleware/auth.js |
| Email verification | Required for most actions (bypassed in dev) | middleware/auth.js |
| OTP protection | Expiry, resend limits, hashed storage | config/otpPolicy.js + models/user.js |
| Signed file downloads | Cloudinary signed URLs for CVs | utils/cloudinaryFile.js |
| Account status | pending/active/suspended/rejected states | models/user.js |
| Cookie security | httpOnly, secure (production), sameSite: 'none' | utils/jwt.js |

## NOT Implemented / Gaps
- No CSRF token middleware (relies on SameSite cookies + CORS)
- No IP-based blocking (only rate limiting)
- No two-factor authentication UI (field exists in model but not wired)
- No audit logging
- No data encryption at rest beyond MongoDB default
- No WebSocket message encryption

---

# PART 24 — TESTING

## Backend Tests (14 files)

| File | What it Tests |
|------|--------------|
| `matching.test.js` | Job matching/recommendation engine scoring |
| `certificateVerification.test.js` | Certificate verification engine unit tests |
| `certificateVerification.integration.test.js` | End-to-end certificate verification flow |
| `cvDownloadAuth.test.js` | CV download authentication (only authorized users) |
| `cvOcrPipeline.test.js` | Tesseract.js OCR processing |
| `cvParserPipeline.test.js` | Full CV parsing pipeline (PDF/DOCX) |
| `cvReadinessRegression.test.js` | CV readiness check regression |
| `cvRecommendationLifecycle.test.js` | CV-triggered job recommendation lifecycle |
| `cvSkillExtraction.test.js` | Skill extraction from CV text |
| `dashboardRecommendations.test.js` | Dashboard recommendation endpoint |
| `defaultResumeRegression.test.js` | Default resume assignment logic regression |
| `deleteCv.test.js` | CV deletion with Cloudinary cleanup |
| `expiredJobLifecycle.test.js` | Expired job status transitions |
| `resumeDownload.test.js` | Resume file download flow |

Uses `mongodb-memory-server` for in-memory MongoDB during tests.

---

# PART 25 — ENVIRONMENT VARIABLES

| Variable | Purpose | Required | Used By |
|----------|---------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | config/db.js |
| `JWT_SECRET` | Access token signing secret | Yes | utils/jwt.js |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Yes | utils/jwt.js |
| `JWT_EXPIRE` | Access token lifetime (default: 7d) | No | utils/jwt.js |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime (default: 30d) | No | utils/jwt.js |
| `PORT` | Server port | No | index.js |
| `CLIENT_URL` | Frontend URL for CORS/links | Yes | index.js, config/email.js |
| `NODE_ENV` | Environment (development/production) | No | index.js |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | config/cloudinary.js |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | config/cloudinary.js |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes | config/cloudinary.js |
| `EMAIL_PROVIDER` | Transport: 'https' or 'smtp' | No | config/email.js |
| `BREVO_API_KEY` | Brevo HTTPS API key | If HTTPS | config/email.js |
| `EMAIL_HOST` | SMTP host | If SMTP | config/email.js |
| `EMAIL_PORT` | SMTP port | If SMTP | config/email.js |
| `EMAIL_SECURE` | SMTP TLS | If SMTP | config/email.js |
| `EMAIL_USER` | SMTP username | If SMTP | config/email.js |
| `EMAIL_PASS` | SMTP password | If SMTP | config/email.js |
| `EMAIL_FROM` | Sender address | No | config/email.js |
| `OTP_EXPIRE_MINUTES` | OTP lifetime | No | config/otpPolicy.js |
| `OTP_RESEND_MAX_ATTEMPTS` | Max OTP resends (default: 3) | No | config/otpPolicy.js |
| `OTP_RESEND_LOCK_HOURS` | OTP lockout duration (default: 4h) | No | config/otpPolicy.js |
| `RATE_LIMIT_WINDOW` | Rate limit window minutes (default: 15) | No | middleware/rateLimiter.js |
| `RATE_LIMIT_MAX` | Max requests per window (default: 100) | No | middleware/rateLimiter.js |
| `VITE_API_URL` | Frontend API base URL | No | client/src/services/api.js |
| `VITE_SOCKET_URL` | Frontend Socket.IO URL | No | client/src/services/socket.js |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | authController.js |

---

# PART 26 — DEPLOYMENT (From Code)

## CONFIRMED FROM CODE
- **Render** deployment: Comments in `.env.example` reference "Render Web Service", Render free tier SMTP blocking, egress IP configuration
- **GitHub**: `.git` directory exists, `.gitignore` present
- **MongoDB Atlas**: `MONGO_URI` format supports Atlas connection strings
- **Cloudinary**: Full integration for file storage
- **Brevo**: HTTPS API integration with SMTP fallback

## INFERRED
- Frontend likely deployed on Render or Vercel (uses Vite, has build script)
- Backend deployed as Render Web Service
- MongoDB hosted on Atlas

## Development Setup
- `npm run dev` uses `concurrently` to run backend (nodemon) and frontend (vite) simultaneously
- Backend on port 5000, frontend on port 5173

---

# PART 27 — FINAL PRESENTATION GUIDE

## A. 30-Second Explanation
"EthioJob Portal is a full-stack MERN application connecting Ethiopian youth with employers. It features AI-powered job matching, resume building with 12 templates, real-time messaging, certificate verification with OCR, and a complete admin moderation system."

## B. 1-Minute Explanation
"Ethiopian youth face high unemployment with limited access to relevant job opportunities. EthioJob Portal solves this by providing a platform where job seekers can build resumes, get AI-matched job recommendations based on their skills and experience, and apply directly. Employers can post jobs, review applicants with match scores, and conduct interviews. Admins moderate all content. The platform supports Amharic, Oromo, and English, includes real-time messaging, certificate verification with OCR, and a fully accessible interface."

## C. 3-5 Minute Explanation

### Problem
Youth unemployment in Ethiopia is a critical challenge. Job seekers lack visibility into opportunities, and employers struggle to find qualified candidates.

### Solution
A full-stack web platform with three user roles:
1. **Job Seekers** — Build resumes, find matched jobs, apply, track applications
2. **Employers** — Create companies, post jobs, review applicants with AI scores, conduct interviews
3. **Admins** — Moderate content, manage users, verify companies and certificates

### Key Technologies
- **Frontend:** React 18, Redux Toolkit, Tailwind CSS, Socket.IO, i18next
- **Backend:** Node.js, Express, Socket.IO, Mongoose
- **Storage:** MongoDB Atlas, Cloudinary
- **Email:** Brevo/SMTP
- **OCR:** Tesseract.js, pdfjs-dist, Mammoth

### Standout Features
1. **AI Job Matching** — Rule-based multi-factor scoring (skills 40%, experience 25%, title 15%, education 10%, location 10%)
2. **Resume Builder** — 12 professional templates with live preview, default resume affects recommendations
3. **CV Parsing** — PDF/DOCX/OCR pipeline extracting structured data
4. **Certificate Verification** — QR code scanning, field comparison, fraud detection
5. **Real-time Messaging** — Socket.IO with typing indicators, read receipts
6. **Multi-language** — English, Amharic, Oromo
7. **Accessibility** — WCAG 2.2 AA compliant with 12+ accessibility features

## D. 10-Minute Technical Demo Order

1. **Home page** — Show landing page, search bar, featured jobs, categories, statistics
2. **Register** — Create a job seeker account, show role selection
3. **Verify email** — Show email verification flow
4. **Login** — Login as job seeker, show role-based redirect
5. **Profile** — Edit profile (add skills, experience, education)
6. **Resume Builder** — Create resume with template, show live preview
7. **Dashboard** — Show stats, recommendations with match scores
8. **Find Jobs** — Search, filter, show match percentage on job cards
9. **Job Details** — Show full description, company info, apply button
10. **Apply** — Upload resume, write cover letter, submit
11. **Switch to Employer** — Logout, login as employer
12. **Create Company** — Show company creation form
13. **Post Job** — Multi-step job posting form
14. **View Applicants** — Show applicant list with match scores
15. **Schedule Interview** — Create interview from application
16. **Messages** — Send message to applicant, show real-time delivery
17. **Certificate Verification** — Upload certificate, show verification result
18. **Switch to Admin** — Login as admin
19. **Admin Dashboard** — Show platform statistics
20. **Approve Job** — Moderate pending job
21. **Manage Users** — Show user list, suspend/activate
22. **Manage Companies** — Approve/reject company

## E. Possible Examiner Questions & Answers

### "How does the recommendation system work?"
"A rule-based weighted algorithm in `backend/utils/matching.js` scores each job against the user's profile. It uses five factors: skills (40%), experience (25%), title match (15%), education (10%), and location (10%). Skills are normalized (e.g., 'React.js' → 'react') and matched with exact + fuzzy comparison. The user's data comes from their Resume Builder document first, then their profile."

### "Why did you use Cloudinary?"
"Cloudinary handles all file storage (avatars, CVs, company logos, certificates) with automatic optimization, CDN delivery, and secure authenticated URLs for sensitive files like CVs."

### "How does Socket.IO work?"
"The Socket.IO server authenticates connections using JWT tokens. When a user connects, they're added to a personal room and a userSocketMap. When a message is sent, it's broadcast to the conversation room. The client SocketService class manages connection lifecycle and event listeners."

### "How does the admin approval work?"
"Companies start as `isApproved: false`. Admins review them via the admin dashboard, seeing documents (business license, TIN certificate). They can approve, reject with reason, or verify. Jobs start as `status: 'pending'` and `isApproved: false`. Admins approve or reject them. Only approved companies and published jobs are visible to job seekers."

### "How does certificate verification work?"
"The system extracts text from uploaded certificates (PDF via pdfjs-dist, images via OCR), decodes QR codes, and looks up a verification number in the trusted certificate database. It then compares 8 fields (name, student ID, certificate number, institution, etc.) field-by-field with weighted scoring. Results: VERIFIED (all match), SUSPICIOUS (mismatches), INVALID (not found), PENDING_REVIEW (no verification number)."

### "What is the difference between Bookmark, Saved Search, and Job Alert?"
"Bookmark saves a specific job for later. Saved Search saves filter criteria (location, category, etc.) with optional new-job notifications. Job Alert creates recurring notifications based on keyword/region/type preferences with configurable frequency (daily/weekly/monthly)."

### "How does the Resume Builder affect recommendations?"
"The recommendation engine (`getRecommendationSourceAndProfile`) specifically looks for the user's default Resume Builder document. The skills, experience, education, and certifications from that document are merged with the user profile and fed into the matching algorithm. Changing the default resume changes which data the matching engine sees, thus changing recommendation scores."

### "Why is Socket.IO used instead of polling?"
"Socket.IO provides real-time bidirectional communication. When a message is sent, it's delivered instantly to the recipient without polling. It also supports typing indicators, read receipts, online status, and real-time notifications — all critical for the messaging experience."

### "How does the three-role system work?"
"Users have a `role` field (jobseeker/employer/admin). The `authorize()` middleware checks `req.user.role` against allowed roles for each route. Protected routes use `protect` (JWT verification) + `authorize('role')` (role check). The frontend uses `ProtectedRoute` component with role prop to prevent unauthorized page access."

---

# TOTALS

| Category | Count |
|----------|-------|
| Backend source files | 86 |
| Frontend source files | 80+ |
| Mongoose models | 16 |
| API routes | 146 endpoints (166 HTTP method registrations) |
| Controller functions | 146 exported + 38 internal helpers |
| Redux slices | 7 |
| Frontend services | 7 |
| React pages | 60+ |
| Resume templates | 12 |
| Test files | 14 |
| Backend tests | 14 |
| Socket.IO events | 10+ |
| Notification types | 23 |
| i18n languages | 3 |
| Accessibility features | 12+ |
