import { Router } from 'express';
import { PaymentMethodController } from '../controllers/paymentMethod.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from '../validators/paymentMethod.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', PaymentMethodController.list);
router.post('/', validateBody(createPaymentMethodSchema), PaymentMethodController.create);
router.patch('/:id', validateBody(updatePaymentMethodSchema), PaymentMethodController.update);
router.delete('/:id', PaymentMethodController.delete);

export const paymentMethodRoutes = router;
