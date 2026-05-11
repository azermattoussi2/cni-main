// ============================================
// Fichier : routes/auth.routes.ts
// ============================================
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { OtpController } from '../controllers/otp.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  validate,
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  otpRequestSchema,
  otpVerifySchema,
} from '../middlewares/validation.middleware';

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), AuthController.login);
// POST /api/auth/register
router.post('/register', validate(registerSchema), AuthController.register);
// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
// POST /api/auth/logout (protégé)
router.post('/logout', authenticate, AuthController.logout);
// GET /api/auth/me
router.get('/me', authenticate, AuthController.me);

// OTP e-mail (candidature stage, inscription)
router.post('/otp/candidature/request', otpLimiter, validate(otpRequestSchema), OtpController.requestCandidature);
router.post('/otp/candidature/verify', otpLimiter, validate(otpVerifySchema), OtpController.verifyCandidature);
router.post('/otp/register/request', otpLimiter, validate(otpRequestSchema), OtpController.requestRegister);
router.post('/otp/register/verify', otpLimiter, validate(otpVerifySchema), OtpController.verifyRegister);
router.post('/otp/test-send', otpLimiter, validate(otpRequestSchema), OtpController.testSend);

export default router;
