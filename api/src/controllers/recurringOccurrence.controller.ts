import { NextFunction, Request, Response } from 'express';
import { RecurringService } from '../services/recurring.service.js';
import {
  confirmPaidSchema,
  queryOccurrencesSchema,
} from '../validators/recurring.validator.js';

export class RecurringOccurrenceController {
  /**
   * GET /api/v1/recurring-occurrences
   */
  static async listOccurrences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query = queryOccurrencesSchema.parse(req.query);

      const result = await RecurringService.listOccurrences(userId, query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/recurring-occurrences/upcoming
   */
  static async getUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const days = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : 7;

      const items = await RecurringService.getUpcomingOccurrences(userId, isNaN(days) ? 7 : days);

      res.status(200).json({
        success: true,
        data: items,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recurring-occurrences/:id/confirm-paid (IDEMPOTENT)
   */
  static async confirmPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const validated = confirmPaidSchema.parse(req.body);

      const result = await RecurringService.confirmPaid(userId, id, validated);

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recurring-occurrences/:id/skip
   */
  static async skip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const occurrence = await RecurringService.skipOccurrence(userId, id);

      res.status(200).json({
        success: true,
        data: occurrence,
        message: 'Occurrence skipped',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
