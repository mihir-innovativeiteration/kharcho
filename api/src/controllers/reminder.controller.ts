import { NextFunction, Request, Response } from 'express';
import { ReminderService } from '../services/reminder.service.js';

export class ReminderController {
  /**
   * GET /api/v1/reminders
   */
  static async listReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const isRead =
        req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

      const result = await ReminderService.listReminders(userId, isRead);

      res.status(200).json({
        success: true,
        data: result.items,
        unreadCount: result.unreadCount,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/reminders/:id/read or POST /api/v1/reminders/:id/read
   */
  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const reminder = await ReminderService.markRead(userId, id);

      res.status(200).json({
        success: true,
        data: reminder,
        message: 'Reminder marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/reminders/read-all or POST /api/v1/reminders/read-all
   */
  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;

      await ReminderService.markAllRead(userId);

      res.status(200).json({
        success: true,
        message: 'All reminders marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
