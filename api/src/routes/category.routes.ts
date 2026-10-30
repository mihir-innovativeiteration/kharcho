import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', CategoryController.list);
router.post('/', validateBody(createCategorySchema), CategoryController.create);
router.patch('/:id', validateBody(updateCategorySchema), CategoryController.update);
router.delete('/:id', CategoryController.delete);

export const categoryRoutes = router;
