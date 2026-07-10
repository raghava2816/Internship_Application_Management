import { Router } from 'express';
import { getSystemStats, getSystemLogs } from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Protect all admin routes - restrict to authenticated users with admin role
router.use(protect);
router.use(adminOnly);

router.get('/stats', getSystemStats);
router.get('/logs', getSystemLogs);

export default router;
