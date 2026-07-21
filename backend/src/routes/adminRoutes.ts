import { Router } from 'express';
import { getSystemStats, getSystemLogs } from '../controllers/adminController';
import { liveAdminFeed } from '../controllers/sseController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Protect all admin routes - restrict to authenticated users with admin role
router.use(protect);
router.use(adminOnly);

router.get('/stats', getSystemStats);
router.get('/logs', getSystemLogs);

// ─── SSE Live Feed ────────────────────────────────────────────────────────────
router.get('/live-feed', liveAdminFeed); // Realtime live admin event stream

export default router;

