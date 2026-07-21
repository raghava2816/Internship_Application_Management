import { Router } from 'express';
import { register, login, getMe, updateProfile, socialLogin, getOAuthConfig, oauthCallback } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/oauth-config', getOAuthConfig);
router.post('/oauth-callback', oauthCallback);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

