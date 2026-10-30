import { NextFunction, Request, Response } from 'express';
import { BudgetAlertService } from '../services/budgetAlert.service.js';
import { queryAlertsSchema } from '../validators/alert.validator.js';

export class BudgetAlertController {
  /**
   * GET /api/v1/budget-alerts
   */
  static async listAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query = queryAlertsSchema.parse(req.query);

      const result = await BudgetAlertService.listAlerts(userId, query);

      res.status(200).json({
        success: true,
        data: result.items,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/budget-alerts/:id/read
   */
  static async markAlertRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const alert = await BudgetAlertService.markAlertRead(userId, id);

      res.status(200).json({
        success: true,
        data: alert,
        message: 'Alert marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/budget-alerts/read-all
   */
  static async markAllAlertsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;

      await BudgetAlertService.markAllAlertsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All alerts marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
