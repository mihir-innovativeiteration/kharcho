import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.patch('/me', requireAuth, validateBody(updateProfileSchema), (req, res, next) =>
  userController.updateMe(req, res, next)
);

router.delete('/me', requireAuth, (req, res, next) =>
  userController.deleteMe(req, res, next)
);

export const userRoutes = router;
