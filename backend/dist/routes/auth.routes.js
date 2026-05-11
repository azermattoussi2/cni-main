"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================
// Fichier : routes/auth.routes.ts
// ============================================
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const otp_controller_1 = require("../controllers/otp.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
const otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
});
// POST /api/auth/login
router.post('/login', (0, validation_middleware_1.validate)(validation_middleware_1.loginSchema), auth_controller_1.AuthController.login);
// POST /api/auth/register
router.post('/register', (0, validation_middleware_1.validate)(validation_middleware_1.registerSchema), auth_controller_1.AuthController.register);
// POST /api/auth/refresh
router.post('/refresh', (0, validation_middleware_1.validate)(validation_middleware_1.refreshTokenSchema), auth_controller_1.AuthController.refresh);
// POST /api/auth/logout (protégé)
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
// GET /api/auth/me
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.me);
// OTP e-mail (candidature stage, inscription)
router.post('/otp/candidature/request', otpLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.otpRequestSchema), otp_controller_1.OtpController.requestCandidature);
router.post('/otp/candidature/verify', otpLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.otpVerifySchema), otp_controller_1.OtpController.verifyCandidature);
router.post('/otp/register/request', otpLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.otpRequestSchema), otp_controller_1.OtpController.requestRegister);
router.post('/otp/register/verify', otpLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.otpVerifySchema), otp_controller_1.OtpController.verifyRegister);
router.post('/otp/test-send', otpLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.otpRequestSchema), otp_controller_1.OtpController.testSend);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map