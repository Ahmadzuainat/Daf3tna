import express from 'express';
import { register, verifyOtp, login, forgotPassword, resetPassword } from '../controllers/authController.js';
import rateLimit from 'express-rate-limit';
import { restrictFeature } from '../middleware/systemMiddleware.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for dev/deployment phase
  message: { message: 'محاولات كثيرة جداً، يرجى المحاولة بعد 15 دقيقة' }
});

router.post('/register', authLimiter, restrictFeature('registrationEnabled'), register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;