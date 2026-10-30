import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  facebookAuthSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter, validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/google', authRateLimiter, validateBody(googleAuthSchema), (req, res, next) =>
  authController.googleAuth(req, res, next)
);

router.post('/facebook', authRateLimiter, validateBody(facebookAuthSchema), (req, res, next) =>
  authController.facebookAuth(req, res, next)
);

router.post('/refresh', validateBody(refreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', validateBody(logoutSchema), (req, res, next) =>
  authController.logout(req, res, next)
);

router.post('/logout-all', requireAuth, (req, res, next) =>
  authController.logoutAll(req, res, next)
);

router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), (req, res, next) =>
  authController.resetPassword(req, res, next)
);

router.post('/verify-email', validateBody(verifyEmailSchema), (req, res, next) =>
  authController.verifyEmail(req, res, next)
);

router.post('/resend-verification', authRateLimiter, validateBody(resendVerificationSchema), (req, res, next) =>
  authController.resendVerification(req, res, next)
);

router.get('/me', requireAuth, (req, res, next) =>
  authController.getMe(req, res, next)
);

export const authRoutes = router;
