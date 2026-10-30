import { Router } from 'express';
import { AITransactionController } from '../controllers/aiTransaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { aiParseRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/parse', aiParseRateLimiter, AITransactionController.parse);
router.post('/confirm', AITransactionController.confirm);

export const aiTransactionRoutes = router;
