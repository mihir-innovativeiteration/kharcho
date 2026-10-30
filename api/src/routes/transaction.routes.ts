import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../validators/transaction.validator.js';

const router = Router();

// All transaction endpoints require authentication
router.use(requireAuth);

router.post('/', validateBody(createTransactionSchema), TransactionController.create);
router.get('/', TransactionController.list);
router.get('/:id', TransactionController.getById);
router.patch('/:id', validateBody(updateTransactionSchema), TransactionController.update);
router.delete('/:id', TransactionController.delete);

export const transactionRoutes = router;
