import { Router } from 'express';
import { BudgetAlertController } from '../controllers/budgetAlert.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All alert endpoints require authentication
router.use(authenticate);

router.get('/', BudgetAlertController.listAlerts);
router.patch('/read-all', BudgetAlertController.markAllAlertsRead);
router.patch('/:id/read', BudgetAlertController.markAlertRead);

export const budgetAlertRoutes = router;
