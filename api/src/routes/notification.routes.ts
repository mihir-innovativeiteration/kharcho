import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { NotificationController } from '../controllers/notification.controller.js';

const router = Router();

// All notification endpoints require authentication
router.use(requireAuth);

// Register device push token
router.post('/device-token', NotificationController.handleRegisterToken);

// Unregister device push token (logout)
router.delete('/device-token', NotificationController.handleUnregisterToken);

// Notification preferences
router.get('/preferences', NotificationController.handleGetPreferences);
router.patch('/preferences', NotificationController.handleUpdatePreferences);

// Safe push test endpoint
router.post('/test-push', NotificationController.handleTestPush);

export { router as notificationRoutes };
