import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', ReminderController.listReminders);
router.patch('/read-all', ReminderController.markAllRead);
router.post('/read-all', ReminderController.markAllRead);
router.patch('/:id/read', ReminderController.markRead);
router.post('/:id/read', ReminderController.markRead);

export const reminderRoutes = router;
