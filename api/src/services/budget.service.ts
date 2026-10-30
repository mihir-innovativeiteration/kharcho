import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { addDecimals, formatDecimal, subtractDecimals, validateAndParseAmount } from '../utils/money.js';
import { BudgetQueryParams, CreateBudgetInput, UpdateBudgetInput } from '../validators/budget.validator.js';
import { BudgetAlertService } from './budgetAlert.service.js';

export class BudgetService {
  /**
   * Determine exact period boundaries and key for a budget or month query
   */
  static getPeriodBounds(
    period: 'MONTHLY' | 'CUSTOM' = 'MONTHLY',
    startDate?: Date | null,
    endDate?: Date | null,
    targetMonth?: string
  ) {
    if (period === 'CUSTOM' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodKey = `custom:${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
      return { start, end, periodKey };
    }

    // Monthly period
    let year: number;
    let monthIdx: number; // 0-indexed

    if (targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)) {
      const parts = targetMonth.split('-');
      year = parseInt(parts[0], 10);
      monthIdx = parseInt(parts[1], 10) - 1;
    } else {
      const now = new Date();
      year = now.getUTCFullYear();
      monthIdx = now.getUTCMonth();
    }

    const start = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));
    const mm = String(monthIdx + 1).padStart(2, '0');
    const periodKey = `${year}-${mm}`;

    return { start, end, periodKey };
  }

  /**
   * Parse warning thresholds from string or array to normalized sorted number array
   */
  static parseThresholds(thresholdsInput?: number[] | string | null): number[] {
    if (!thresholdsInput) return [50, 80, 100];
    if (Array.isArray(thresholdsInput)) {
      return Array.from(new Set(thresholdsInput)).sort((a, b) => a - b);
    }
    const parsed = thresholdsInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    return parsed.length > 0 ? Array.from(new Set(parsed)).sort((a, b) => a - b) : [50, 80, 100];
  }

  /**
   * Determine threshold status label from utilization percentage
   */
  static getThresholdStatus(utilizationPercent: number): 'NORMAL' | 'WARNING_50' | 'WARNING_80' | 'EXCEEDED' {
    if (utilizationPercent >= 100) return 'EXCEEDED';
    if (utilizationPercent >= 80) return 'WARNING_80';
    if (utilizationPercent >= 50) return 'WARNING_50';
    return 'NORMAL';
  }

  /**
   * Format budget with computed progress metrics
   */
  static formatBudgetWithProgress(
    budget: any,
    spentDecimal: Prisma.Decimal,
    bounds: { start: Date; end: Date; periodKey: string }
  ) {
    const budgetAmountDec =
      budget.amount instanceof Prisma.Decimal ? budget.amount : new Prisma.Decimal(budget.amount);
    const remainingDec = subtractDecimals(budgetAmountDec, spentDecimal);
    const isExceeded = remainingDec.isNegative();

    let utilizationPercentage = 0;
    if (budgetAmountDec.greaterThan(0)) {
      utilizationPercentage = Number(
        spentDecimal.dividedBy(budgetAmountDec).times(100).toFixed(1)
      );
    }

    const thresholdStatus = this.getThresholdStatus(utilizationPercentage);
    const thresholds = this.parseThresholds(budget.warningThresholds);

    return {
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      type: budget.type,
      categoryId: budget.categoryId || null,
      category: budget.category
        ? {
            id: budget.category.id,
            name: budget.category.name,
            icon: budget.category.icon,
            color: budget.category.color,
          }
        : null,
      amount: formatDecimal(budgetAmountDec),
      spent: formatDecimal(spentDecimal),
      remaining: formatDecimal(remainingDec),
      currency: budget.currency,
      period: budget.period,
      periodKey: bounds.periodKey,
      startDate: bounds.start.toISOString(),
      endDate: bounds.end.toISOString(),
      utilizationPercentage,
      isExceeded,
      thresholdStatus,
      warningThresholds: thresholds,
      isActive: budget.isActive,
      createdAt: budget.createdAt instanceof Date ? budget.createdAt.toISOString() : budget.createdAt,
      updatedAt: budget.updatedAt instanceof Date ? budget.updatedAt.toISOString() : budget.updatedAt,
    };
  }

  /**
   * Create a new budget
   */
  static async createBudget(userId: string, input: CreateBudgetInput, db: any = prisma) {
    const amountValidation = validateAndParseAmount(input.amount);
    if (!amountValidation.valid || !amountValidation.decimal) {
      const err: any = new Error(amountValidation.error || 'Invalid budget limit amount');
      err.statusCode = 400;
      throw err;
    }

    let category = null;
    if (input.type === 'CATEGORY') {
      if (!input.categoryId) {
        const err: any = new Error('Category is required for category-specific budgets');
        err.statusCode = 400;
        throw err;
      }

      category = await db.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category || (!category.isSystem && category.userId !== userId)) {
        const err: any = new Error('Category not found or inaccessible');
        err.statusCode = 404;
        throw err;
      }

      if (category.type !== 'EXPENSE') {
        const err: any = new Error('Category budgets must be assigned to an EXPENSE category');
        err.statusCode = 400;
        throw err;
      }
    }

    const bounds = this.getPeriodBounds(
      input.period,
      input.startDate ? new Date(input.startDate) : null,
      input.endDate ? new Date(input.endDate) : null
    );

    // Prevent duplicate active budget for same user + type + categoryId + period
    const existing = await db.budget.findFirst({
      where: {
        userId,
        type: input.type,
        categoryId: input.type === 'CATEGORY' ? input.categoryId : null,
        period: input.period,
        isActive: true,
      },
    });

    if (existing) {
      const err: any = new Error(
        input.type === 'OVERALL'
          ? 'An active overall monthly budget already exists'
          : `An active budget already exists for category '${category?.name || 'selected'}'`
      );
      err.statusCode = 409;
      throw err;
    }

    const thresholds = this.parseThresholds(input.warningThresholds);

    const budget = await db.budget.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        categoryId: input.type === 'CATEGORY' ? input.categoryId : null,
        amount: amountValidation.decimal,
        currency: input.currency || 'INR',
        period: input.period || 'MONTHLY',
        startDate: input.period === 'CUSTOM' && input.startDate ? new Date(input.startDate) : null,
        endDate: input.period === 'CUSTOM' && input.endDate ? new Date(input.endDate) : null,
        warningThresholds: thresholds.join(','),
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // Calculate initial spending & evaluate thresholds
    const spent = await this.calculateSpending(userId, budget, bounds, db);
    const formatted = this.formatBudgetWithProgress(budget, spent, bounds);

    // Evaluate alerts
    await BudgetAlertService.evaluateBudgetThresholds(
      userId,
      budget.id,
      thresholds,
      formatted.utilizationPercentage,
      bounds.periodKey,
      db
    );

    return formatted;
  }

  /**
   * Calculate spending for a budget within its period bounds
   */
  static async calculateSpending(
    userId: string,
    budget: any,
    bounds: { start: Date; end: Date },
    db: any
  ): Promise<Prisma.Decimal> {
    const where: any = {
      userId,
      type: 'EXPENSE',
      currency: budget.currency || 'INR',
      transactionDate: {
        gte: bounds.start,
        lte: bounds.end,
      },
    };

    if (budget.type === 'CATEGORY' && budget.categoryId) {
      where.categoryId = budget.categoryId;
    }

    const transactions = await db.transaction.findMany({
      where,
      select: { amount: true },
    });

    let total = new Prisma.Decimal('0.00');
    for (const tx of transactions) {
      const amt = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);
      total = addDecimals(total, amt);
    }

    return total;
  }

  /**
   * List all user budgets with calculated progress
   */
  static async listBudgets(userId: string, query: BudgetQueryParams, db: any = prisma) {
    const where: any = { userId };
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const budgets = await db.budget.findMany({
      where,
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
      include: { category: true },
    });

    const bounds = this.getPeriodBounds('MONTHLY', null, null, query.month);

    // Fetch all user expense transactions in the period in a single batch query
    const transactions = await db.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        currency: query.currency || 'INR',
        transactionDate: {
          gte: bounds.start,
          lte: bounds.end,
        },
      },
      select: { categoryId: true, amount: true },
    });

    // Group spending by categoryId and overall total
    const categorySpendingMap = new Map<string, Prisma.Decimal>();
    let overallExpenseTotal = new Prisma.Decimal('0.00');

    for (const tx of transactions) {
      const amt = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);
      overallExpenseTotal = addDecimals(overallExpenseTotal, amt);

      if (tx.categoryId) {
        const current = categorySpendingMap.get(tx.categoryId) || new Prisma.Decimal('0.00');
        categorySpendingMap.set(tx.categoryId, addDecimals(current, amt));
      }
    }

    const results = [];
    for (const budget of budgets) {
      const budgetBounds =
        budget.period === 'CUSTOM'
          ? this.getPeriodBounds('CUSTOM', budget.startDate, budget.endDate)
          : bounds;

      let spent = new Prisma.Decimal('0.00');
      if (budget.period === 'CUSTOM') {
        spent = await this.calculateSpending(userId, budget, budgetBounds, db);
      } else if (budget.type === 'OVERALL') {
        spent = overallExpenseTotal;
      } else if (budget.categoryId) {
        spent = categorySpendingMap.get(budget.categoryId) || new Prisma.Decimal('0.00');
      }

      results.push(this.formatBudgetWithProgress(budget, spent, budgetBounds));
    }

    return results;
  }

  /**
   * Get single budget with progress
   */
  static async getBudget(userId: string, budgetId: string, month?: string, db: any = prisma) {
    const budget = await db.budget.findUnique({
      where: { id: budgetId },
      include: { category: true },
    });

    if (!budget || budget.userId !== userId) {
      const err: any = new Error('Budget not found');
      err.statusCode = 404;
      throw err;
    }

    const bounds =
      budget.period === 'CUSTOM'
        ? this.getPeriodBounds('CUSTOM', budget.startDate, budget.endDate)
        : this.getPeriodBounds('MONTHLY', null, null, month);

    const spent = await this.calculateSpending(userId, budget, bounds, db);
    return this.formatBudgetWithProgress(budget, spent, bounds);
  }

  /**
   * Get overall monthly budget summary for dashboard/overview
   */
  static async getBudgetSummary(userId: string, month?: string, db: any = prisma) {
    const bounds = this.getPeriodBounds('MONTHLY', null, null, month);

    // Find all active monthly budgets
    const budgets = await db.budget.findMany({
      where: {
        userId,
        isActive: true,
        period: 'MONTHLY',
      },
      include: { category: true },
    });

    // Check if there is an explicit OVERALL budget
    const overallBudget = budgets.find((b: any) => b.type === 'OVERALL');

    // Total budgeted: if overall budget exists, that is the primary limit;
    // otherwise sum of category budgets
    let totalBudgetDec = new Prisma.Decimal('0.00');
    if (overallBudget) {
      totalBudgetDec =
        overallBudget.amount instanceof Prisma.Decimal
          ? overallBudget.amount
          : new Prisma.Decimal(overallBudget.amount);
    } else {
      for (const b of budgets) {
        const amt = b.amount instanceof Prisma.Decimal ? b.amount : new Prisma.Decimal(b.amount);
        totalBudgetDec = addDecimals(totalBudgetDec, amt);
      }
    }

    // Total actual expenses in period
    const expenses = await db.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: bounds.start,
          lte: bounds.end,
        },
      },
      select: { amount: true },
    });

    let totalSpentDec = new Prisma.Decimal('0.00');
    for (const tx of expenses) {
      const amt = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);
      totalSpentDec = addDecimals(totalSpentDec, amt);
    }

    const remainingDec = subtractDecimals(totalBudgetDec, totalSpentDec);
    const isOverBudget = remainingDec.isNegative();

    let percentageUsed = 0;
    if (totalBudgetDec.greaterThan(0)) {
      percentageUsed = Number(
        totalSpentDec.dividedBy(totalBudgetDec).times(100).toFixed(1)
      );
    }

    return {
      periodKey: bounds.periodKey,
      totalBudget: formatDecimal(totalBudgetDec),
      totalSpent: formatDecimal(totalSpentDec),
      remaining: formatDecimal(remainingDec),
      percentageUsed,
      isOverBudget,
      activeBudgetsCount: budgets.length,
      hasOverallBudget: Boolean(overallBudget),
    };
  }

  /**
   * Update budget
   */
  static async updateBudget(
    userId: string,
    budgetId: string,
    input: UpdateBudgetInput,
    db: any = prisma
  ) {
    const existing = await db.budget.findUnique({
      where: { id: budgetId },
      include: { category: true },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Budget not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.currency !== undefined) updateData.currency = input.currency;

    if (input.amount !== undefined) {
      const val = validateAndParseAmount(input.amount);
      if (!val.valid || !val.decimal) {
        const err: any = new Error(val.error || 'Invalid amount');
        err.statusCode = 400;
        throw err;
      }
      updateData.amount = val.decimal;
    }

    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        const cat = await db.category.findUnique({ where: { id: input.categoryId } });
        if (!cat || (!cat.isSystem && cat.userId !== userId)) {
          const err: any = new Error('Category not found');
          err.statusCode = 404;
          throw err;
        }
        if (cat.type !== 'EXPENSE') {
          const err: any = new Error('Budget category must be an EXPENSE category');
          err.statusCode = 400;
          throw err;
        }
        updateData.categoryId = input.categoryId;
      } else {
        updateData.categoryId = null;
      }
    }

    if (input.warningThresholds !== undefined) {
      const thresholds = this.parseThresholds(input.warningThresholds);
      updateData.warningThresholds = thresholds.join(',');
    }

    if (input.startDate !== undefined) {
      updateData.startDate = input.startDate ? new Date(input.startDate) : null;
    }
    if (input.endDate !== undefined) {
      updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    const updated = await db.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: { category: true },
    });

    const bounds =
      updated.period === 'CUSTOM'
        ? this.getPeriodBounds('CUSTOM', updated.startDate, updated.endDate)
        : this.getPeriodBounds('MONTHLY');

    const spent = await this.calculateSpending(userId, updated, bounds, db);
    const formatted = this.formatBudgetWithProgress(updated, spent, bounds);

    // Re-evaluate alerts
    const thresholds = this.parseThresholds(updated.warningThresholds);
    await BudgetAlertService.evaluateBudgetThresholds(
      userId,
      updated.id,
      thresholds,
      formatted.utilizationPercentage,
      bounds.periodKey,
      db
    );

    return formatted;
  }

  /**
   * Delete budget
   */
  static async deleteBudget(userId: string, budgetId: string, db: any = prisma) {
    const existing = await db.budget.findUnique({
      where: { id: budgetId },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Budget not found');
      err.statusCode = 404;
      throw err;
    }

    await db.budget.delete({
      where: { id: budgetId },
    });

    return { id: budgetId, deleted: true };
  }

  /**
   * Evaluate all active budgets for user (called after transaction mutations)
   */
  static async evaluateAllBudgetsForUser(userId: string, txDate: Date = new Date(), db: any = prisma) {
    const budgets = await db.budget.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: { category: true },
    });

    const mm = String(txDate.getUTCMonth() + 1).padStart(2, '0');
    const monthStr = `${txDate.getUTCFullYear()}-${mm}`;

    for (const budget of budgets) {
      const bounds =
        budget.period === 'CUSTOM'
          ? this.getPeriodBounds('CUSTOM', budget.startDate, budget.endDate)
          : this.getPeriodBounds('MONTHLY', null, null, monthStr);

      const spent = await this.calculateSpending(userId, budget, bounds, db);
      const budgetAmountDec =
        budget.amount instanceof Prisma.Decimal ? budget.amount : new Prisma.Decimal(budget.amount);

      let utilizationPercentage = 0;
      if (budgetAmountDec.greaterThan(0)) {
        utilizationPercentage = Number(
          spent.dividedBy(budgetAmountDec).times(100).toFixed(1)
        );
      }

      const thresholds = this.parseThresholds(budget.warningThresholds);
      await BudgetAlertService.evaluateBudgetThresholds(
        userId,
        budget.id,
        thresholds,
        utilizationPercentage,
        bounds.periodKey,
        db
      );
    }
  }
}
