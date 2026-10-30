import { NextFunction, Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { transactionQuerySchema } from '../validators/transaction.validator.js';

export class TransactionController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tx = await TransactionService.createTransaction(userId, req.body);
      res.status(201).json({
        success: true,
        data: tx,
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = transactionQuerySchema.parse(req.query);
      const result = await TransactionService.listTransactions(userId, query);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tx = await TransactionService.getTransaction(userId, req.params.id);
      res.status(200).json({
        success: true,
        data: tx,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tx = await TransactionService.updateTransaction(userId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: tx,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await TransactionService.deleteTransaction(userId, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
