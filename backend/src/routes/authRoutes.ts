import { Router } from 'express';
import { register, login, getMe, updateProfile, socialLogin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
