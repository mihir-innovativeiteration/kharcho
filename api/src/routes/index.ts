import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { transactionRoutes } from './transaction.routes.js';
import { categoryRoutes } from './category.routes.js';
import { paymentMethodRoutes } from './paymentMethod.routes.js';
import { financeRoutes } from './finance.routes.js';
import { budgetRoutes } from './budget.routes.js';
import { budgetAlertRoutes } from './budgetAlert.routes.js';
import { savingsRoutes } from './savings.routes.js';
import { recurringRuleRoutes } from './recurringRule.routes.js';
import { recurringOccurrenceRoutes } from './recurringOccurrence.routes.js';
import { reminderRoutes } from './reminder.routes.js';
import { aiTransactionRoutes } from './aiTransaction.routes.js';
import { syncRoutes } from './sync.routes.js';
import { notificationRoutes } from './notification.routes.js';
import { RecurringSchedulerService } from '../services/recurringScheduler.service.js';

const router = Router();

// Health check endpoint (safe, no secrets or infrastructure disclosure)
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'kharcho-api',
  });
});

// Scheduler tick trigger (internal / cron / worker trigger)
router.post('/recurring/scheduler-tick', async (_req, res, next) => {
  try {
    const result = await RecurringSchedulerService.processSchedulerTick();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/finance', financeRoutes);
router.use('/budgets', budgetRoutes);
router.use('/budget-alerts', budgetAlertRoutes);
router.use('/savings-goals', savingsRoutes);
router.use('/recurring-rules', recurringRuleRoutes);
router.use('/recurring-occurrences', recurringOccurrenceRoutes);
router.use('/reminders', reminderRoutes);
router.use('/ai/transactions', aiTransactionRoutes);
router.use('/sync', syncRoutes);
router.use('/notifications', notificationRoutes);

export const apiRouter = router;
