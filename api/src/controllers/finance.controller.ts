import { NextFunction, Request, Response } from 'express';
import { FinanceService } from '../services/finance.service.js';
import { financeQuerySchema } from '../validators/finance.validator.js';

export class FinanceController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = financeQuerySchema.parse(req.query);
      const summary = await FinanceService.getSummary(userId, query);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCategoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = financeQuerySchema.parse(req.query);
      const breakdown = await FinanceService.getCategoryBreakdown(userId, query);
      res.status(200).json({
        success: true,
        data: breakdown,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = financeQuerySchema.parse(req.query);
      const trends = await FinanceService.getTrends(userId, query);
      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (err) {
      next(err);
    }
  }
}
