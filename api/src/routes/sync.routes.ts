import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { SyncController } from '../controllers/sync.controller.js';

const router = Router();

// All sync routes require authentication
router.use(requireAuth);

// Process batch of offline outbox operations
router.post('/operations', SyncController.handleBatchSync);

// Fetch incremental changes since cursor
router.get('/changes', SyncController.handleGetChanges);

export { router as syncRoutes };
