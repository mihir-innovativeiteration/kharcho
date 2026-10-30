import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { addDecimals, formatDecimal, subtractDecimals, validateAndParseAmount } from '../utils/money.js';
import {
  CreateContributionInput,
  CreateSavingsGoalInput,
  SavingsGoalQueryParams,
  UpdateSavingsGoalInput,
} from '../validators/savings.validator.js';

export const SAVINGS_DISCLAIMER =
  'Contributions are manual tracking entries, not real transfers of money.';

export class SavingsService {
  /**
   * Format savings goal with computed progress
   */
  static formatGoalWithProgress(goal: any, totalSavedDec: Prisma.Decimal) {
    const targetDec =
      goal.targetAmount instanceof Prisma.Decimal
        ? goal.targetAmount
        : new Prisma.Decimal(goal.targetAmount);

    const remainingDec = subtractDecimals(targetDec, totalSavedDec);
    const clampedRemaining = remainingDec.isNegative() ? new Prisma.Decimal('0.00') : remainingDec;

    let completionPercentage = 0;
    if (targetDec.greaterThan(0)) {
      completionPercentage = Number(
        totalSavedDec.dividedBy(targetDec).times(100).toFixed(1)
      );
    }

    return {
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      description: goal.description || null,
      targetAmount: formatDecimal(targetDec),
      totalSaved: formatDecimal(totalSavedDec),
      remainingAmount: formatDecimal(clampedRemaining),
      completionPercentage,
      currency: goal.currency,
      targetDate: goal.targetDate instanceof Date ? goal.targetDate.toISOString() : goal.targetDate,
      icon: goal.icon || 'PiggyBank',
      color: goal.color || '#10B981',
      status: goal.status,
      isCompleted: goal.status === 'COMPLETED' || totalSavedDec.greaterThanOrEqualTo(targetDec),
      contributionsCount: goal.contributions?.length ?? 0,
      disclaimer: SAVINGS_DISCLAIMER,
      createdAt: goal.createdAt instanceof Date ? goal.createdAt.toISOString() : goal.createdAt,
      updatedAt: goal.updatedAt instanceof Date ? goal.updatedAt.toISOString() : goal.updatedAt,
    };
  }

  /**
   * Format contribution ledger entry
   */
  static formatContribution(c: any) {
    const amtDec = c.amount instanceof Prisma.Decimal ? c.amount : new Prisma.Decimal(c.amount);
    return {
      id: c.id,
      userId: c.userId,
      goalId: c.goalId,
      amount: formatDecimal(amtDec),
      contributionDate:
        c.contributionDate instanceof Date ? c.contributionDate.toISOString() : c.contributionDate,
      note: c.note || null,
      disclaimer: SAVINGS_DISCLAIMER,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    };
  }

  /**
   * Create a new savings goal
   */
  static async createGoal(userId: string, input: CreateSavingsGoalInput, db: any = prisma) {
    const amountVal = validateAndParseAmount(input.targetAmount);
    if (!amountVal.valid || !amountVal.decimal) {
      const err: any = new Error(amountVal.error || 'Invalid target amount');
      err.statusCode = 400;
      throw err;
    }

    const goal = await db.savingsGoal.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        targetAmount: amountVal.decimal,
        currency: input.currency || 'INR',
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        icon: input.icon || 'PiggyBank',
        color: input.color || '#10B981',
        status: 'ACTIVE',
      },
    });

    return this.formatGoalWithProgress(goal, new Prisma.Decimal('0.00'));
  }

  /**
   * List user savings goals with progress and contributions sum
   */
  static async listGoals(userId: string, query: SavingsGoalQueryParams, db: any = prisma) {
    const where: any = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const goals = await db.savingsGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contributions: {
          select: { amount: true },
        },
      },
    });

    return goals.map((goal: any) => {
      let totalSaved = new Prisma.Decimal('0.00');
      if (goal.contributions) {
        for (const c of goal.contributions) {
          const amt = c.amount instanceof Prisma.Decimal ? c.amount : new Prisma.Decimal(c.amount);
          totalSaved = addDecimals(totalSaved, amt);
        }
      }
      return this.formatGoalWithProgress(goal, totalSaved);
    });
  }

  /**
   * Get single goal with recent contributions and progress
   */
  static async getGoal(userId: string, goalId: string, db: any = prisma) {
    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        contributions: {
          orderBy: { contributionDate: 'desc' },
          take: 50,
        },
      },
    });

    if (!goal || goal.userId !== userId) {
      const err: any = new Error('Savings goal not found');
      err.statusCode = 404;
      throw err;
    }

    let totalSaved = new Prisma.Decimal('0.00');
    for (const c of goal.contributions) {
      const amt = c.amount instanceof Prisma.Decimal ? c.amount : new Prisma.Decimal(c.amount);
      totalSaved = addDecimals(totalSaved, amt);
    }

    const formattedGoal = this.formatGoalWithProgress(goal, totalSaved);
    return {
      ...formattedGoal,
      contributions: goal.contributions.map(this.formatContribution),
    };
  }

  /**
   * Update savings goal
   */
  static async updateGoal(
    userId: string,
    goalId: string,
    input: UpdateSavingsGoalInput,
    db: any = prisma
  ) {
    const existing = await db.savingsGoal.findUnique({
      where: { id: goalId },
      include: { contributions: true },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Savings goal not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.targetDate !== undefined) {
      updateData.targetDate = input.targetDate ? new Date(input.targetDate) : null;
    }

    if (input.targetAmount !== undefined) {
      const val = validateAndParseAmount(input.targetAmount);
      if (!val.valid || !val.decimal) {
        const err: any = new Error(val.error || 'Invalid target amount');
        err.statusCode = 400;
        throw err;
      }
      updateData.targetAmount = val.decimal;
    }

    const updated = await db.savingsGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    let totalSaved = new Prisma.Decimal('0.00');
    for (const c of existing.contributions) {
      const amt = c.amount instanceof Prisma.Decimal ? c.amount : new Prisma.Decimal(c.amount);
      totalSaved = addDecimals(totalSaved, amt);
    }

    return this.formatGoalWithProgress(updated, totalSaved);
  }

  /**
   * Delete savings goal (cascades contributions)
   */
  static async deleteGoal(userId: string, goalId: string, db: any = prisma) {
    const existing = await db.savingsGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Savings goal not found');
      err.statusCode = 404;
      throw err;
    }

    await db.savingsGoal.delete({
      where: { id: goalId },
    });

    return { id: goalId, deleted: true };
  }

  /**
   * Add contribution to savings goal (server-side ledger)
   */
  static async addContribution(
    userId: string,
    goalId: string,
    input: CreateContributionInput,
    db: any = prisma
  ) {
    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
      include: { contributions: true },
    });

    if (!goal || goal.userId !== userId) {
      const err: any = new Error('Savings goal not found');
      err.statusCode = 404;
      throw err;
    }

    const amountVal = validateAndParseAmount(input.amount);
    if (!amountVal.valid || !amountVal.decimal) {
      const err: any = new Error(amountVal.error || 'Invalid contribution amount');
      err.statusCode = 400;
      throw err;
    }

    const contribution = await db.savingsContribution.create({
      data: {
        userId,
        goalId,
        amount: amountVal.decimal,
        contributionDate: input.contributionDate ? new Date(input.contributionDate) : new Date(),
        note: input.note || null,
      },
    });

    // Recalculate total saved
    let totalSaved = new Prisma.Decimal('0.00');
    for (const c of goal.contributions) {
      const amt = c.amount instanceof Prisma.Decimal ? c.amount : new Prisma.Decimal(c.amount);
      totalSaved = addDecimals(totalSaved, amt);
    }
    totalSaved = addDecimals(totalSaved, amountVal.decimal);

    // If total saved meets or exceeds target and goal is currently ACTIVE, update to COMPLETED
    const targetDec =
      goal.targetAmount instanceof Prisma.Decimal
        ? goal.targetAmount
        : new Prisma.Decimal(goal.targetAmount);

    let updatedGoal = goal;
    if (totalSaved.greaterThanOrEqualTo(targetDec) && goal.status === 'ACTIVE') {
      updatedGoal = await db.savingsGoal.update({
        where: { id: goalId },
        data: { status: 'COMPLETED' },
      });
    }

    return {
      contribution: this.formatContribution(contribution),
      goal: this.formatGoalWithProgress(updatedGoal, totalSaved),
    };
  }

  /**
   * List contributions for a goal
   */
  static async listContributions(userId: string, goalId: string, db: any = prisma) {
    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== userId) {
      const err: any = new Error('Savings goal not found');
      err.statusCode = 404;
      throw err;
    }

    const items = await db.savingsContribution.findMany({
      where: { goalId, userId },
      orderBy: { contributionDate: 'desc' },
    });

    return items.map(this.formatContribution);
  }

  /**
   * Delete / Reverse a contribution
   */
  static async deleteContribution(
    userId: string,
    goalId: string,
    contributionId: string,
    db: any = prisma
  ) {
    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
      include: { contributions: true },
    });

    if (!goal || goal.userId !== userId) {
      const err: any = new Error('Savings goal not found');
      err.statusCode = 404;
      throw err;
    }

    const contribution = await db.savingsContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution || contribution.userId !== userId || contribution.goalId !== goalId) {
      const err: any = new Error('Contribution not found');
      err.statusCode = 404;
      throw err;
    }

    await db.savingsContribution.delete({
      where: { id: contributionId },
    });

    // Recalculate total saved after deletion
    const remainingContributions = goal.contributions.filter((c: any) => c.id !== contributionId);
    let totalSaved = new Prisma.Decimal('0.00');
    for (const c of remainingContributions) {
      const amt = c.amount instanceof Prisma.Decimal ? c.amount : new Prisma.Decimal(c.amount);
      totalSaved = addDecimals(totalSaved, amt);
    }

    // If total saved now falls below target and goal was COMPLETED, restore to ACTIVE
    const targetDec =
      goal.targetAmount instanceof Prisma.Decimal
        ? goal.targetAmount
        : new Prisma.Decimal(goal.targetAmount);

    let updatedGoal = goal;
    if (totalSaved.lessThan(targetDec) && goal.status === 'COMPLETED') {
      updatedGoal = await db.savingsGoal.update({
        where: { id: goalId },
        data: { status: 'ACTIVE' },
      });
    }

    return {
      deletedContributionId: contributionId,
      goal: this.formatGoalWithProgress(updatedGoal, totalSaved),
    };
  }
}
