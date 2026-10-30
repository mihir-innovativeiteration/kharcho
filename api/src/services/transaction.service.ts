import { prisma } from '../config/db.js';
import { formatDecimal, validateAndParseAmount } from '../utils/money.js';
import {
  CreateTransactionInput,
  TransactionQueryParams,
  UpdateTransactionInput,
} from '../validators/transaction.validator.js';
import { BudgetService } from './budget.service.js';

export class TransactionService {
  /**
   * Format database transaction record for API response
   */
  static formatTransaction(tx: any) {
    return {
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      amount: formatDecimal(tx.amount),
      currency: tx.currency,
      description: tx.description,
      categoryId: tx.categoryId,
      category: tx.category
        ? {
            id: tx.category.id,
            name: tx.category.name,
            type: tx.category.type,
            icon: tx.category.icon,
            color: tx.category.color,
            isSystem: tx.category.isSystem,
          }
        : undefined,
      paymentMethodId: tx.paymentMethodId,
      paymentMethod: tx.paymentMethod
        ? {
            id: tx.paymentMethod.id,
            name: tx.paymentMethod.name,
            type: tx.paymentMethod.type,
            details: tx.paymentMethod.details,
            isSystem: tx.paymentMethod.isSystem,
          }
        : null,
      transactionDate: tx.transactionDate instanceof Date ? tx.transactionDate.toISOString() : tx.transactionDate,
      notes: tx.notes || null,
      clientMutationId: tx.clientMutationId || null,
      version: tx.version !== undefined ? tx.version : 1,
      deletedAt: tx.deletedAt ? (tx.deletedAt instanceof Date ? tx.deletedAt.toISOString() : tx.deletedAt) : null,
      createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
      updatedAt: tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : tx.updatedAt,
    };
  }

  /**
   * Validate category ownership and type compatibility
   */
  private static async validateCategory(
    userId: string,
    categoryId: string,
    expectedType: 'INCOME' | 'EXPENSE',
    db: any
  ) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || (!category.isSystem && category.userId !== userId)) {
      const err: any = new Error('Category not found or inaccessible');
      err.statusCode = 404;
      throw err;
    }

    if (category.type !== expectedType) {
      const err: any = new Error(
        `Category '${category.name}' has type '${category.type}', which is incompatible with transaction type '${expectedType}'`
      );
      err.statusCode = 400;
      throw err;
    }

    return category;
  }

  /**
   * Validate payment method ownership
   */
  private static async validatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    db: any
  ) {
    const pm = await db.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!pm || (!pm.isSystem && pm.userId !== userId)) {
      const err: any = new Error('Payment method not found or inaccessible');
      err.statusCode = 404;
      throw err;
    }

    return pm;
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    userId: string,
    input: CreateTransactionInput & { clientMutationId?: string; version?: number },
    db: any = prisma
  ) {
    // Check idempotency if clientMutationId provided
    if (input.clientMutationId) {
      const existingTx = await db.transaction.findFirst({
        where: {
          userId,
          clientMutationId: input.clientMutationId,
        },
        include: {
          category: true,
          paymentMethod: true,
        },
      });
      if (existingTx) {
        return this.formatTransaction(existingTx);
      }
    }

    const amountValidation = validateAndParseAmount(input.amount);
    if (!amountValidation.valid || !amountValidation.decimal) {
      const err: any = new Error(amountValidation.error || 'Invalid monetary amount');
      err.statusCode = 400;
      throw err;
    }

    // Validate category existence, ownership, and type
    await this.validateCategory(userId, input.categoryId, input.type, db);

    // Validate payment method if provided
    if (input.paymentMethodId) {
      await this.validatePaymentMethod(userId, input.paymentMethodId, db);
    }

    const tx = await db.transaction.create({
      data: {
        userId,
        type: input.type,
        amount: amountValidation.decimal,
        currency: input.currency || 'INR',
        description: input.description,
        categoryId: input.categoryId,
        paymentMethodId: input.paymentMethodId || null,
        transactionDate: new Date(input.transactionDate),
        notes: input.notes || null,
        clientMutationId: input.clientMutationId || null,
        version: input.version || 1,
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    const formatted = this.formatTransaction(tx);

    if (tx.type === 'EXPENSE') {
      void BudgetService.evaluateAllBudgetsForUser(userId, tx.transactionDate, db).catch(() => {});
    }

    return formatted;
  }

  /**
   * List transactions with pagination, filters, search, and sorting
   */
  static async listTransactions(userId: string, query: TransactionQueryParams, db: any = prisma) {
    const where: any = {
      userId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.paymentMethodId) {
      where.paymentMethodId = query.paymentMethodId;
    }

    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transactionDate.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search } },
        { notes: { contains: query.search } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    // Allowlist sorting with stable secondary sort
    const orderBy: any[] = [
      { [query.sortBy]: query.sortOrder },
      { id: 'desc' },
    ];

    const [total, items] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          paymentMethod: true,
        },
      }),
    ]);

    return {
      items: items.map(this.formatTransaction),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Get single transaction by ID (strictly isolated to owner)
   */
  static async getTransaction(userId: string, transactionId: string, db: any = prisma) {
    const tx = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    if (!tx || tx.userId !== userId) {
      const err: any = new Error('Transaction not found');
      err.statusCode = 404;
      throw err;
    }

    const formatted = this.formatTransaction(tx);

    if (tx.type === 'EXPENSE') {
      void BudgetService.evaluateAllBudgetsForUser(userId, tx.transactionDate, db).catch(() => {});
    }

    return formatted;
  }

  /**
   * Update transaction (strictly isolated to owner)
   */
  static async updateTransaction(
    userId: string,
    transactionId: string,
    input: UpdateTransactionInput,
    db: any = prisma
  ) {
    const existing = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Transaction not found');
      err.statusCode = 404;
      throw err;
    }

    const targetType = input.type || existing.type;
    const targetCategoryId = input.categoryId || existing.categoryId;

    // If type or category changed, validate compatibility
    if (input.type || input.categoryId) {
      await this.validateCategory(userId, targetCategoryId, targetType, db);
    }

    // If payment method changed, validate ownership
    if (input.paymentMethodId !== undefined && input.paymentMethodId !== null) {
      await this.validatePaymentMethod(userId, input.paymentMethodId, db);
    }

    let parsedAmount = undefined;
    if (input.amount !== undefined) {
      const validation = validateAndParseAmount(input.amount);
      if (!validation.valid || !validation.decimal) {
        const err: any = new Error(validation.error || 'Invalid monetary amount');
        err.statusCode = 400;
        throw err;
      }
      parsedAmount = validation.decimal;
    }

    const updated = await db.transaction.update({
      where: { id: transactionId },
      data: {
        ...(input.type ? { type: input.type } : {}),
        ...(parsedAmount ? { amount: parsedAmount } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.paymentMethodId !== undefined ? { paymentMethodId: input.paymentMethodId } : {}),
        ...(input.transactionDate ? { transactionDate: new Date(input.transactionDate) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        version: (existing.version || 1) + 1,
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    const formatted = this.formatTransaction(updated);

    if (updated.type === 'EXPENSE' || existing.type === 'EXPENSE') {
      void BudgetService.evaluateAllBudgetsForUser(userId, updated.transactionDate, db).catch(() => {});
    }

    return formatted;
  }

  /**
   * Delete transaction (strictly isolated to owner)
   */
  static async deleteTransaction(userId: string, transactionId: string, db: any = prisma) {
    const existing = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Transaction not found');
      err.statusCode = 404;
      throw err;
    }

    await db.transaction.delete({
      where: { id: transactionId },
    });

    if (existing.type === 'EXPENSE') {
      void BudgetService.evaluateAllBudgetsForUser(userId, existing.transactionDate, db).catch(() => {});
    }

    return { success: true, id: transactionId };
  }
}
