import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';

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

// Middlewares
app.use(cors({
  origin: '*', // Allow connections from frontend dev server
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
    message: 'Welcome to AI Internship Tracker Pro API Services',
    status: 'healthy',
    timestamp: new Date()
  });
});

// Error handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 API Server running in production-ready mode on port ${PORT}`);
});
