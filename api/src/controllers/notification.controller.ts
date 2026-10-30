import { Request, Response, NextFunction } from 'express';
import {
  registerPushTokenSchema,
  unregisterPushTokenSchema,
  updateNotificationPreferencesSchema,
} from '../validators/notification.validator.js';
import { PushNotificationService } from '../services/pushNotification.service.js';

export class NotificationController {
  /**
   * Register Expo push token for authenticated device
   */
  static async handleRegisterToken(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerPushTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const result = await PushNotificationService.registerDeviceToken(
        req.user!.id,
        parsed.data
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unregister Expo push token
   */
  static async handleUnregisterToken(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = unregisterPushTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      await PushNotificationService.unregisterDeviceToken(
        req.user!.id,
        parsed.data.token
      );

      return res.status(200).json({
        success: true,
        message: 'Device push token unregistered successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get notification preferences
   */
  static async handleGetPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await PushNotificationService.getPreferences(req.user!.id);
      return res.status(200).json({
        success: true,
        data: prefs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update notification preferences
   */
  static async handleUpdatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateNotificationPreferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const updated = await PushNotificationService.updatePreferences(
        req.user!.id,
        parsed.data
      );

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Safe test endpoint for dispatching a push notification
   */
  static async handleTestPush(req: Request, res: Response, next: NextFunction) {
    try {
      const title = req.body.title || 'Kharcho Test Notification';
      const body = req.body.body || 'This is a test notification from Kharcho.';
      const category = req.body.category || 'general';

      const result = await PushNotificationService.sendPushNotification(
        req.user!.id,
        {
          title,
          body,
          category,
          data: req.body.data || {},
        }
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
