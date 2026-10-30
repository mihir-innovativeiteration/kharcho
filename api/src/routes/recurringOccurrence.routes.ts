import { Router } from 'express';
import { RecurringOccurrenceController } from '../controllers/recurringOccurrence.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', RecurringOccurrenceController.listOccurrences);
router.get('/upcoming', RecurringOccurrenceController.getUpcoming);
router.post('/:id/confirm-paid', RecurringOccurrenceController.confirmPaid);
router.post('/:id/skip', RecurringOccurrenceController.skip);

export const recurringOccurrenceRoutes = router;
