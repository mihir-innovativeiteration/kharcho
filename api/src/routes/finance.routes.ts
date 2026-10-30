import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', FinanceController.getSummary);
router.get('/category-breakdown', FinanceController.getCategoryBreakdown);
router.get('/trends', FinanceController.getTrends);

export const financeRoutes = router;
