import { NextFunction, Request, Response } from 'express';
import { RecurringService } from '../services/recurring.service.js';
import {
  createRecurringRuleSchema,
  queryRecurringRulesSchema,
  updateRecurringRuleSchema,
} from '../validators/recurring.validator.js';

export class RecurringRuleController {
  /**
   * POST /api/v1/recurring-rules
   */
  static async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = createRecurringRuleSchema.parse(req.body);

      const rule = await RecurringService.createRule(userId, validated);

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Recurring rule created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/recurring-rules
   */
  static async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query = queryRecurringRulesSchema.parse(req.query);

      const result = await RecurringService.listRules(userId, query);

      res.status(200).json({
        success: true,
        data: result.items,
        estimates: result.estimates,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/recurring-rules/:id
   */
  static async getRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const rule = await RecurringService.getRule(userId, id);

      res.status(200).json({
        success: true,
        data: rule,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/recurring-rules/:id
   */
  static async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const validated = updateRecurringRuleSchema.parse(req.body);

      const updated = await RecurringService.updateRule(userId, id, validated);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Recurring rule updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recurring-rules/:id/pause
   */
  static async pauseRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const updated = await RecurringService.setRuleStatus(userId, id, 'PAUSED');

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Recurring rule paused',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recurring-rules/:id/resume
   */
  static async resumeRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const updated = await RecurringService.setRuleStatus(userId, id, 'ACTIVE');

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Recurring rule resumed',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recurring-rules/:id/cancel
   */
  static async cancelRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const updated = await RecurringService.setRuleStatus(userId, id, 'CANCELLED');

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Recurring rule cancelled',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/recurring-rules/:id
   */
  static async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await RecurringService.deleteRule(userId, id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Recurring rule deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
