import { Router } from 'express';
import { SavingsController } from '../controllers/savings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All savings goal endpoints require authentication
router.use(authenticate);

router.post('/', SavingsController.createGoal);
router.get('/', SavingsController.listGoals);
router.get('/:id', SavingsController.getGoal);
router.patch('/:id', SavingsController.updateGoal);
router.delete('/:id', SavingsController.deleteGoal);

// Contribution ledger endpoints
router.post('/:id/contributions', SavingsController.addContribution);
router.get('/:id/contributions', SavingsController.listContributions);
router.delete('/:id/contributions/:contributionId', SavingsController.deleteContribution);

export const savingsRoutes = router;
