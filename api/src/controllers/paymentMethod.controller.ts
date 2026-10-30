import { NextFunction, Request, Response } from 'express';
import { PaymentMethodService } from '../services/paymentMethod.service.js';

export class PaymentMethodController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const methods = await PaymentMethodService.listPaymentMethods(userId);
      res.status(200).json({
        success: true,
        data: methods,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const method = await PaymentMethodService.createPaymentMethod(userId, req.body);
      res.status(201).json({
        success: true,
        data: method,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const method = await PaymentMethodService.updatePaymentMethod(userId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: method,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await PaymentMethodService.deletePaymentMethod(userId, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
