// ============================================
// OnlineJob Portal - Backend Server Entry Point
// ============================================
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// ============================================
// Initialize Express App & HTTP Server
// ============================================
const app = express();
const server = http.createServer(app);

// ============================================
// Initialize Socket.IO
// ============================================
initializeSocket(server);

// ============================================
// Connect to Database
// ============================================
connectDB();

// ============================================
// Security & Essential Middleware
// ============================================
app.use(helmet()); // Set security headers

// Trust the first proxy hop so req.ip / rate limiting work behind Render's proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const isProduction = process.env.NODE_ENV === 'production';

// In production only CLIENT_URL is allowed; local/LAN origins are dev-only conveniences
const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://172.16.3.110:5173']),
].filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow non-browser requests (health checks, curl, server-to-server)
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       // Development-only LAN/localhost allowances
//       if (
//         !isProduction &&
//         (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://172.16.'))
//       ) {
//         return callback(null, true);
//       }
//       return callback(new Error(`Origin ${origin} not allowed by CORS`));
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests or any Vercel deployment domain
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      // Development-only LAN/localhost allowances
      if (
        !isProduction &&
        (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://172.16.'))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(compression()); // Compress responses

// ============================================
// Body Parsers & Cookie Parser
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// Logging (Development)
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// Rate Limiting
// ============================================
app.use('/api/', apiLimiter);

// ============================================
// Health Check Route
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌍 OnlineJob Portal API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Health Check Passed ✅',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/employer', require('./routes/employerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/saved-searches', require('./routes/savedSearchRoutes'));
app.use('/api/job-alerts', require('./routes/jobAlertRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.post('/api/contact', require('./routes/contactRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// NOTE: Debug/test email routes were removed for security. The former
// POST /api/debug/send-test-email endpoint allowed anyone to send emails
// from the configured account whenever NODE_ENV was not "production".

// ============================================
// Serve Frontend in Production
// ============================================
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  } else {
    console.warn('Production client build not found. Skipping static asset serving.');
  }
}

// ============================================
// Error Handlers (Must be last)
// ============================================
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🌍  OnlineJob Portal - BACKEND SERVER 🌍           ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}                                    ║
║   Server running on: http://localhost:${PORT}              ║
║   API Base: http://localhost:${PORT}/api                   ║
║   Socket.IO: ✅ ENABLED                                   ║
║                                                           ║
║   Status: ✅ READY                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start background interview reminder interval (runs every 5 minutes)
  const { checkAndSendInterviewReminders } = require('./controllers/interviewController');
  setInterval(() => {
    checkAndSendInterviewReminders().catch((e) => console.error('Interview reminder runner error:', e.message));
  }, 5 * 60 * 1000);
});

// ============================================
// Handle Unhandled Promise Rejections
// ============================================
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated.');
  });
});

module.exports = app;

