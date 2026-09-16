import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Force Node.js DNS resolver to use IPv4 first. This prevents IPv6 SRV resolution failures on Jio/consumer networks.
dns.setDefaultResultOrder('ipv4first');
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import resumeRoutes from './routes/resumeRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorMiddleware';


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Security and Optimization Middlewares
app.use(helmet());
app.use(compression());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', apiLimiter);

// CORS
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['*'];
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Restrict to frontend in production
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable response buffering for SSE routes (ensures tokens flush immediately)
app.use((req, res, next) => {
  if (req.path.includes('/stream') || req.path.includes('/live-feed')) {
    res.setHeader('X-Accel-Buffering', 'no');
    (res as any).flush = () => {}; // no-op compat shim
  }
  next();
});

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CareerFlow API Services',
    status: 'healthy',
    timestamp: new Date()
  });
});

// Error handling Middleware
app.use(errorHandler);

// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 API Server running in production-ready mode on port ${PORT}`);
});
