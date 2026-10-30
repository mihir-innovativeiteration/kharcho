import { NextFunction, Request, Response } from 'express';
import { SavingsService } from '../services/savings.service.js';
import {
  createContributionSchema,
  createSavingsGoalSchema,
  savingsGoalQuerySchema,
  updateSavingsGoalSchema,
} from '../validators/savings.validator.js';

export class SavingsController {
  /**
   * POST /api/v1/savings-goals
   */
  static async createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = createSavingsGoalSchema.parse(req.body);

      const goal = await SavingsService.createGoal(userId, validated);

      res.status(201).json({
        success: true,
        data: goal,
        message: 'Savings goal created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/savings-goals
   */
  static async listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query = savingsGoalQuerySchema.parse(req.query);

      const goals = await SavingsService.listGoals(userId, query);

      res.status(200).json({
        success: true,
        data: goals,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/savings-goals/:id
   */
  static async getGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const goal = await SavingsService.getGoal(userId, id);

      res.status(200).json({
        success: true,
        data: goal,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/savings-goals/:id
   */
  static async updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const validated = updateSavingsGoalSchema.parse(req.body);

      const updated = await SavingsService.updateGoal(userId, id, validated);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Savings goal updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/savings-goals/:id
   */
  static async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await SavingsService.deleteGoal(userId, id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Savings goal deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/savings-goals/:id/contributions
   */
  static async addContribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const validated = createContributionSchema.parse(req.body);

      const result = await SavingsService.addContribution(userId, id, validated);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Contribution added successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/savings-goals/:id/contributions
   */
  static async listContributions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const contributions = await SavingsService.listContributions(userId, id);

      res.status(200).json({
        success: true,
        data: contributions,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/savings-goals/:id/contributions/:contributionId
   */
  static async deleteContribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id, contributionId } = req.params;

      const result = await SavingsService.deleteContribution(userId, id, contributionId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Contribution reversed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
