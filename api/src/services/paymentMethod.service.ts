import { prisma } from '../config/db.js';
import { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../validators/paymentMethod.validator.js';

export class PaymentMethodService {
  /**
   * List all system default payment methods plus user's custom payment methods
   */
  static async listPaymentMethods(userId: string, db: any = prisma) {
    const methods = await db.paymentMethod.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return methods;
  }

  /**
   * Create custom payment method for user
   */
  static async createPaymentMethod(userId: string, input: CreatePaymentMethodInput, db: any = prisma) {
    const method = await db.paymentMethod.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        details: input.details || null,
        isSystem: false,
      },
    });

    return method;
  }

  /**
   * Update user's custom payment method
   */
  static async updatePaymentMethod(userId: string, id: string, input: UpdatePaymentMethodInput, db: any = prisma) {
    const method = await db.paymentMethod.findUnique({
      where: { id },
    });

    if (!method || (method.userId !== userId && !method.isSystem)) {
      const err: any = new Error('Payment method not found');
      err.statusCode = 404;
      throw err;
    }

    if (method.isSystem) {
      const err: any = new Error('System payment methods cannot be modified');
      err.statusCode = 403;
      throw err;
    }

    const updated = await db.paymentMethod.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.details !== undefined ? { details: input.details } : {}),
      },
    });

    return updated;
  }

  /**
   * Delete user's custom payment method
   */
  static async deletePaymentMethod(userId: string, id: string, db: any = prisma) {
    const method = await db.paymentMethod.findUnique({
      where: { id },
    });

    if (!method || (method.userId !== userId && !method.isSystem)) {
      const err: any = new Error('Payment method not found');
      err.statusCode = 404;
      throw err;
    }

    if (method.isSystem) {
      const err: any = new Error('System payment methods cannot be deleted');
      err.statusCode = 403;
      throw err;
    }

    await db.paymentMethod.delete({
      where: { id },
    });

    return { success: true, id };
  }
}
