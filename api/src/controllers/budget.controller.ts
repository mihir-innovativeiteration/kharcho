import { NextFunction, Request, Response } from 'express';
import { BudgetService } from '../services/budget.service.js';
import {
  budgetQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '../validators/budget.validator.js';

export class BudgetController {
  /**
   * POST /api/v1/budgets
   */
  static async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = createBudgetSchema.parse(req.body);

      const budget = await BudgetService.createBudget(userId, validated);

      res.status(201).json({
        success: true,
        data: budget,
        message: 'Budget created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/budgets
   */
  static async listBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query = budgetQuerySchema.parse(req.query);

      const budgets = await BudgetService.listBudgets(userId, query);

      res.status(200).json({
        success: true,
        data: budgets,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/budgets/summary
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const month = typeof req.query.month === 'string' ? req.query.month : undefined;

      const summary = await BudgetService.getBudgetSummary(userId, month);

      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/budgets/:id
   */
  static async getBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const month = typeof req.query.month === 'string' ? req.query.month : undefined;

      const budget = await BudgetService.getBudget(userId, id, month);

      res.status(200).json({
        success: true,
        data: budget,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/budgets/:id/progress
   */
  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const month = typeof req.query.month === 'string' ? req.query.month : undefined;

      const budget = await BudgetService.getBudget(userId, id, month);

      res.status(200).json({
        success: true,
        data: {
          id: budget.id,
          amount: budget.amount,
          spent: budget.spent,
          remaining: budget.remaining,
          utilizationPercentage: budget.utilizationPercentage,
          isExceeded: budget.isExceeded,
          thresholdStatus: budget.thresholdStatus,
          periodKey: budget.periodKey,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/budgets/:id
   */
  static async updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const validated = updateBudgetSchema.parse(req.body);

      const updated = await BudgetService.updateBudget(userId, id, validated);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Budget updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/budgets/:id
   */
  static async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await BudgetService.deleteBudget(userId, id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Budget deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
