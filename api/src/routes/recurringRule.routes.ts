import { Router } from 'express';
import { RecurringRuleController } from '../controllers/recurringRule.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', RecurringRuleController.createRule);
router.get('/', RecurringRuleController.listRules);
router.get('/:id', RecurringRuleController.getRule);
router.patch('/:id', RecurringRuleController.updateRule);
router.post('/:id/pause', RecurringRuleController.pauseRule);
router.patch('/:id/pause', RecurringRuleController.pauseRule);
router.post('/:id/resume', RecurringRuleController.resumeRule);
router.patch('/:id/resume', RecurringRuleController.resumeRule);
router.post('/:id/cancel', RecurringRuleController.cancelRule);
router.patch('/:id/cancel', RecurringRuleController.cancelRule);
router.delete('/:id', RecurringRuleController.deleteRule);

export const recurringRuleRoutes = router;
