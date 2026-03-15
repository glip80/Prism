import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../../../shared/middleware/auth';
import { authRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter as any, authController.login.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/me', authenticateToken, authController.me.bind(authController));
router.post('/check-permission', authenticateToken, authController.checkPermission.bind(authController));

export default router;
