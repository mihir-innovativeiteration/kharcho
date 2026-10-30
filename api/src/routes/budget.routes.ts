import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All budget endpoints require authentication
router.use(authenticate);

router.post('/', BudgetController.createBudget);
router.get('/', BudgetController.listBudgets);
router.get('/summary', BudgetController.getSummary);
router.get('/:id', BudgetController.getBudget);
router.get('/:id/progress', BudgetController.getProgress);
router.patch('/:id', BudgetController.updateBudget);
router.delete('/:id', BudgetController.deleteBudget);

export const budgetRoutes = router;
