import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { formatDecimal, validateAndParseAmount } from '../utils/money.js';
import { RecurrenceService } from './recurrence.service.js';
import {
  ConfirmPaidInput,
  CreateRecurringRuleInput,
  QueryOccurrencesParams,
  QueryRecurringRulesParams,
  UpdateRecurringRuleInput,
} from '../validators/recurring.validator.js';

export class RecurringService {
  /**
   * Format recurring rule for API responses
   */
  static formatRule(rule: any) {
    const amountDec =
      rule.amount instanceof Prisma.Decimal ? rule.amount : new Prisma.Decimal(rule.amount);

    return {
      id: rule.id,
      userId: rule.userId,
      title: rule.title,
      description: rule.description || null,
      providerName: rule.providerName || null,
      type: rule.type,
      amount: formatDecimal(amountDec),
      currency: rule.currency,
      categoryId: rule.categoryId || null,
      category: rule.category
        ? {
            id: rule.category.id,
            name: rule.category.name,
            icon: rule.category.icon,
            color: rule.category.color,
          }
        : null,
      paymentMethodId: rule.paymentMethodId || null,
      paymentMethod: rule.paymentMethod
        ? {
            id: rule.paymentMethod.id,
            name: rule.paymentMethod.name,
            type: rule.paymentMethod.type,
          }
        : null,
      frequency: rule.frequency,
      interval: rule.interval,
      startDate: rule.startDate instanceof Date ? rule.startDate.toISOString() : rule.startDate,
      nextDueAt: rule.nextDueAt instanceof Date ? rule.nextDueAt.toISOString() : rule.nextDueAt,
      endDate: rule.endDate instanceof Date ? rule.endDate.toISOString() : rule.endDate || null,
      timezone: rule.timezone,
      reminderEnabled: rule.reminderEnabled,
      reminderDaysBefore: rule.reminderDaysBefore,
      autoPost: rule.autoPost,
      status: rule.status,
      occurrencesCount: rule.occurrences?.length,
      createdAt: rule.createdAt instanceof Date ? rule.createdAt.toISOString() : rule.createdAt,
      updatedAt: rule.updatedAt instanceof Date ? rule.updatedAt.toISOString() : rule.updatedAt,
    };
  }

  /**
   * Format occurrence record for API responses
   */
  static formatOccurrence(occ: any) {
    return {
      id: occ.id,
      recurringRuleId: occ.recurringRuleId,
      userId: occ.userId,
      occurrenceKey: occ.occurrenceKey,
      scheduledAt: occ.scheduledAt instanceof Date ? occ.scheduledAt.toISOString() : occ.scheduledAt,
      status: occ.status,
      transactionId: occ.transactionId || null,
      transaction: occ.transaction
        ? {
            id: occ.transaction.id,
            amount: formatDecimal(occ.transaction.amount),
            type: occ.transaction.type,
            description: occ.transaction.description,
            transactionDate:
              occ.transaction.transactionDate instanceof Date
                ? occ.transaction.transactionDate.toISOString()
                : occ.transaction.transactionDate,
          }
        : null,
      rule: occ.rule ? RecurringService.formatRule(occ.rule) : undefined,
      reminderSentAt: occ.reminderSentAt ? new Date(occ.reminderSentAt).toISOString() : null,
      paidAt: occ.paidAt ? new Date(occ.paidAt).toISOString() : null,
      createdAt: occ.createdAt instanceof Date ? occ.createdAt.toISOString() : occ.createdAt,
      updatedAt: occ.updatedAt instanceof Date ? occ.updatedAt.toISOString() : occ.updatedAt,
    };
  }

  /**
   * Validate category ownership and compatibility
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
        `Category '${category.name}' has type '${category.type}', which is incompatible with recurring rule type '${expectedType}'`
      );
      err.statusCode = 400;
      throw err;
    }

    return category;
  }

  /**
   * Create a new recurring rule and its first occurrence
   */
  static async createRule(userId: string, input: CreateRecurringRuleInput, db: any = prisma) {
    const amountVal = validateAndParseAmount(input.amount);
    if (!amountVal.valid || !amountVal.decimal) {
      const err: any = new Error(amountVal.error || 'Invalid monetary amount');
      err.statusCode = 400;
      throw err;
    }

    // Validate category if supplied
    if (input.categoryId) {
      await this.validateCategory(userId, input.categoryId, input.type, db);
    }

    // Validate payment method if supplied
    if (input.paymentMethodId) {
      const pm = await db.paymentMethod.findUnique({ where: { id: input.paymentMethodId } });
      if (!pm || (!pm.isSystem && pm.userId !== userId)) {
        const err: any = new Error('Payment method not found or inaccessible');
        err.statusCode = 404;
        throw err;
      }
    }

    const startDate = new Date(input.startDate);
    const nextDueAt = startDate; // First occurrence is due at start date
    const endDate = input.endDate ? new Date(input.endDate) : null;

    const rule = await db.recurringRule.create({
      data: {
        userId,
        title: input.title,
        description: input.description || null,
        providerName: input.providerName || null,
        type: input.type,
        amount: amountVal.decimal,
        currency: input.currency || 'INR',
        categoryId: input.categoryId || null,
        paymentMethodId: input.paymentMethodId || null,
        frequency: input.frequency,
        interval: input.interval || 1,
        startDate,
        nextDueAt,
        endDate,
        timezone: input.timezone || 'Asia/Kolkata',
        reminderEnabled: input.reminderEnabled !== undefined ? input.reminderEnabled : true,
        reminderDaysBefore: input.reminderDaysBefore !== undefined ? input.reminderDaysBefore : 1,
        autoPost: input.autoPost !== undefined ? input.autoPost : false,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    // Create the first scheduled occurrence
    const occurrenceKey = RecurrenceService.getOccurrenceKey(rule.id, nextDueAt);
    const initialStatus = nextDueAt.getTime() <= Date.now() ? 'DUE' : 'UPCOMING';

    await db.recurringOccurrence.create({
      data: {
        recurringRuleId: rule.id,
        userId,
        occurrenceKey,
        scheduledAt: nextDueAt,
        status: initialStatus,
      },
    });

    return RecurringService.formatRule(rule);
  }

  /**
   * List recurring rules with filters, pagination, and monthly estimates
   */
  static async listRules(userId: string, query: QueryRecurringRulesParams, db: any = prisma) {
    const where: any = { userId };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.frequency) where.frequency = query.frequency;

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, rules, activeRules] = await Promise.all([
      db.recurringRule.count({ where }),
      db.recurringRule.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { nextDueAt: 'asc' }],
        include: {
          category: true,
          paymentMethod: true,
        },
      }),
      // For monthly projected estimates
      db.recurringRule.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { type: true, amount: true, frequency: true, interval: true },
      }),
    ]);

    // Calculate estimated monthly totals
    let estimatedMonthlyExpenses = new Prisma.Decimal('0.00');
    let estimatedMonthlyIncome = new Prisma.Decimal('0.00');

    for (const r of activeRules) {
      const amt = r.amount instanceof Prisma.Decimal ? r.amount : new Prisma.Decimal(r.amount);
      let monthlyEquivalent = amt;

      const interval = r.interval > 0 ? r.interval : 1;
      if (r.frequency === 'DAILY') {
        monthlyEquivalent = amt.times(30).dividedBy(interval);
      } else if (r.frequency === 'WEEKLY') {
        monthlyEquivalent = amt.times(4.33).dividedBy(interval);
      } else if (r.frequency === 'MONTHLY') {
        monthlyEquivalent = amt.dividedBy(interval);
      } else if (r.frequency === 'YEARLY') {
        monthlyEquivalent = amt.dividedBy(12 * interval);
      }

      if (r.type === 'EXPENSE') {
        estimatedMonthlyExpenses = estimatedMonthlyExpenses.plus(monthlyEquivalent);
      } else if (r.type === 'INCOME') {
        estimatedMonthlyIncome = estimatedMonthlyIncome.plus(monthlyEquivalent);
      }
    }

    return {
      items: rules.map((r: any) => RecurringService.formatRule(r)),
      estimates: {
        monthlyExpenses: formatDecimal(estimatedMonthlyExpenses),
        monthlyIncome: formatDecimal(estimatedMonthlyIncome),
        monthlyNet: formatDecimal(estimatedMonthlyIncome.minus(estimatedMonthlyExpenses)),
        projectedMonthlyExpense: formatDecimal(estimatedMonthlyExpenses),
        projectedMonthlyIncome: formatDecimal(estimatedMonthlyIncome),
        projectedMonthlyNet: formatDecimal(estimatedMonthlyIncome.minus(estimatedMonthlyExpenses)),
        currency: 'INR',
        notice: 'Estimated monthly recurring totals based on active rules. These are projections, not confirmed bank transactions.',
      },
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Get single rule with occurrences history
   */
  static async getRule(userId: string, ruleId: string, db: any = prisma) {
    const rule = await db.recurringRule.findUnique({
      where: { id: ruleId },
      include: {
        category: true,
        paymentMethod: true,
        occurrences: {
          orderBy: { scheduledAt: 'desc' },
          take: 20,
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!rule || rule.userId !== userId) {
      const err: any = new Error('Recurring rule not found');
      err.statusCode = 404;
      throw err;
    }

    const formatted = RecurringService.formatRule(rule);
    return {
      ...formatted,
      occurrences: (rule.occurrences || []).map((o: any) => RecurringService.formatOccurrence(o)),
    };
  }

  /**
   * Update permitted fields of a rule
   */
  static async updateRule(
    userId: string,
    ruleId: string,
    input: UpdateRecurringRuleInput,
    db: any = prisma
  ) {
    const existing = await db.recurringRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Recurring rule not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.providerName !== undefined) updateData.providerName = input.providerName;
    if (input.frequency !== undefined) updateData.frequency = input.frequency;
    if (input.interval !== undefined) updateData.interval = input.interval;
    if (input.reminderEnabled !== undefined) updateData.reminderEnabled = input.reminderEnabled;
    if (input.reminderDaysBefore !== undefined) updateData.reminderDaysBefore = input.reminderDaysBefore;
    if (input.autoPost !== undefined) updateData.autoPost = input.autoPost;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.endDate !== undefined) {
      updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    if (input.amount !== undefined) {
      const amountVal = validateAndParseAmount(input.amount);
      if (!amountVal.valid || !amountVal.decimal) {
        const err: any = new Error(amountVal.error || 'Invalid amount');
        err.statusCode = 400;
        throw err;
      }
      updateData.amount = amountVal.decimal;
    }

    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        await this.validateCategory(userId, input.categoryId, existing.type, db);
        updateData.categoryId = input.categoryId;
      } else {
        updateData.categoryId = null;
      }
    }

    if (input.paymentMethodId !== undefined) {
      if (input.paymentMethodId) {
        const pm = await db.paymentMethod.findUnique({ where: { id: input.paymentMethodId } });
        if (!pm || (!pm.isSystem && pm.userId !== userId)) {
          const err: any = new Error('Payment method not found');
          err.statusCode = 404;
          throw err;
        }
        updateData.paymentMethodId = input.paymentMethodId;
      } else {
        updateData.paymentMethodId = null;
      }
    }

    const updated = await db.recurringRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    return RecurringService.formatRule(updated);
  }

  /**
   * Set rule status (PAUSED, ACTIVE, CANCELLED)
   */
  static async setRuleStatus(
    userId: string,
    ruleId: string,
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED',
    db: any = prisma
  ) {
    const existing = await db.recurringRule.findUnique({ where: { id: ruleId } });
    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Recurring rule not found');
      err.statusCode = 404;
      throw err;
    }

    const updated = await db.recurringRule.update({
      where: { id: ruleId },
      data: { status },
      include: { category: true, paymentMethod: true },
    });

    return RecurringService.formatRule(updated);
  }

  /**
   * Delete recurring rule
   */
  static async deleteRule(userId: string, ruleId: string, db: any = prisma) {
    const existing = await db.recurringRule.findUnique({ where: { id: ruleId } });
    if (!existing || existing.userId !== userId) {
      const err: any = new Error('Recurring rule not found');
      err.statusCode = 404;
      throw err;
    }

    await db.recurringRule.delete({ where: { id: ruleId } });
    return { id: ruleId, deleted: true };
  }

  /**
   * List occurrences with filters
   */
  static async listOccurrences(userId: string, query: QueryOccurrencesParams, db: any = prisma) {
    const where: any = { userId };
    const ruleId = query.ruleId || (query as any).recurringRuleId;
    if (ruleId) where.recurringRuleId = ruleId;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.scheduledAt = {};
      if (query.startDate) where.scheduledAt.gte = new Date(query.startDate);
      if (query.endDate) where.scheduledAt.lte = new Date(query.endDate);
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, items] = await Promise.all([
      db.recurringOccurrence.count({ where }),
      db.recurringOccurrence.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledAt: 'asc' },
        include: {
          rule: {
            include: { category: true, paymentMethod: true },
          },
          transaction: true,
        },
      }),
    ]);

    return {
      items: items.map((o: any) => RecurringService.formatOccurrence(o)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Get upcoming and overdue occurrences for next N days
   */
  static async getUpcomingOccurrences(userId: string, days = 7, db: any = prisma) {
    const now = new Date();
    const endWindow = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const occurrences = await db.recurringOccurrence.findMany({
      where: {
        userId,
        status: { in: ['UPCOMING', 'DUE', 'AWAITING_CONFIRMATION'] },
        scheduledAt: { lte: endWindow },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        rule: {
          include: { category: true, paymentMethod: true },
        },
      },
    });

    return occurrences.map((o: any) => RecurringService.formatOccurrence(o));
  }

  /**
   * Confirm that an occurrence was paid (IDEMPOTENT)
   * Creates exactly 1 Transaction and links it, marks occurrence PAID, advances rule's nextDueAt.
   */
  static async confirmPaid(
    userId: string,
    occurrenceId: string,
    input: ConfirmPaidInput = {},
    db: any = prisma
  ) {
    const occurrence = await db.recurringOccurrence.findUnique({
      where: { id: occurrenceId },
      include: {
        rule: {
          include: { category: true },
        },
        transaction: true,
      },
    });

    if (!occurrence || occurrence.userId !== userId) {
      const err: any = new Error('Occurrence not found');
      err.statusCode = 404;
      throw err;
    }

    // Idempotency check: If already paid or already linked to a transaction, return cleanly without duplicating!
    if (occurrence.status === 'PAID' && occurrence.transactionId) {
      return {
        alreadyPaid: true,
        occurrence: RecurringService.formatOccurrence(occurrence),
        transaction: occurrence.transaction,
        message: 'This scheduled payment was already confirmed and recorded.',
      };
    }

    const rule = occurrence.rule;
    const paidDate = input.paidAt ? new Date(input.paidAt) : new Date();

    // Determine category ID: fallback to a default system category if rule didn't have one
    const categoryId =
      rule.categoryId ||
      (rule.type === 'INCOME' ? 'cat_salary' : 'cat_bills_utilities');

    // Create 1 actual financial transaction
    const tx = await db.transaction.create({
      data: {
        userId,
        type: rule.type,
        amount: rule.amount,
        currency: rule.currency,
        description: `${rule.title} (${rule.frequency})`,
        categoryId,
        paymentMethodId: input.paymentMethodId || rule.paymentMethodId || null,
        transactionDate: paidDate,
        notes: input.notes || `Recurring confirmation for ${rule.title}`,
      },
    });

    // Mark occurrence PAID and link transaction
    const updatedOccurrence = await db.recurringOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: 'PAID',
        paidAt: paidDate,
        transactionId: tx.id,
      },
      include: {
        rule: { include: { category: true } },
        transaction: true,
      },
    });

    // Calculate next due date for the rule
    const nextDue = RecurrenceService.calculateNextDueDate(
      occurrence.scheduledAt,
      rule.frequency,
      rule.interval,
      rule.startDate
    );

    const isComplete = RecurrenceService.isPastEndDate(nextDue, rule.endDate);

    if (isComplete) {
      await db.recurringRule.update({
        where: { id: rule.id },
        data: { status: 'COMPLETED' },
      });
    } else {
      await db.recurringRule.update({
        where: { id: rule.id },
        data: { nextDueAt: nextDue },
      });

      // Schedule next occurrence if not past end date
      const nextKey = RecurrenceService.getOccurrenceKey(rule.id, nextDue);
      const nextStatus = nextDue.getTime() <= Date.now() ? 'DUE' : 'UPCOMING';

      // Idempotently create next occurrence
      const existingNext = await db.recurringOccurrence.findFirst({
        where: { recurringRuleId: rule.id, occurrenceKey: nextKey },
      });

      if (!existingNext) {
        await db.recurringOccurrence.create({
          data: {
            recurringRuleId: rule.id,
            userId,
            occurrenceKey: nextKey,
            scheduledAt: nextDue,
            status: nextStatus,
          },
        });
      }
    }

    return {
      alreadyPaid: false,
      occurrence: RecurringService.formatOccurrence(updatedOccurrence),
      transaction: tx,
      nextDueAt: isComplete ? null : nextDue.toISOString(),
      message: 'Payment confirmed successfully and transaction recorded.',
    };
  }

  /**
   * Skip an occurrence without creating a transaction
   */
  static async skipOccurrence(userId: string, occurrenceId: string, db: any = prisma) {
    const occurrence = await db.recurringOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { rule: true },
    });

    if (!occurrence || occurrence.userId !== userId) {
      const err: any = new Error('Occurrence not found');
      err.statusCode = 404;
      throw err;
    }

    if (occurrence.status === 'PAID') {
      const err: any = new Error('Cannot skip an occurrence that has already been paid');
      err.statusCode = 400;
      throw err;
    }

    if (occurrence.status === 'SKIPPED') {
      return RecurringService.formatOccurrence(occurrence);
    }

    const updated = await db.recurringOccurrence.update({
      where: { id: occurrenceId },
      data: { status: 'SKIPPED' },
      include: { rule: { include: { category: true } } },
    });

    const rule = occurrence.rule;
    const nextDue = RecurrenceService.calculateNextDueDate(
      occurrence.scheduledAt,
      rule.frequency,
      rule.interval,
      rule.startDate
    );

    const isComplete = RecurrenceService.isPastEndDate(nextDue, rule.endDate);

    if (isComplete) {
      await db.recurringRule.update({
        where: { id: rule.id },
        data: { status: 'COMPLETED' },
      });
    } else {
      await db.recurringRule.update({
        where: { id: rule.id },
        data: { nextDueAt: nextDue },
      });

      const nextKey = RecurrenceService.getOccurrenceKey(rule.id, nextDue);
      const existingNext = await db.recurringOccurrence.findFirst({
        where: { recurringRuleId: rule.id, occurrenceKey: nextKey },
      });

      if (!existingNext) {
        await db.recurringOccurrence.create({
          data: {
            recurringRuleId: rule.id,
            userId,
            occurrenceKey: nextKey,
            scheduledAt: nextDue,
            status: nextDue.getTime() <= Date.now() ? 'DUE' : 'UPCOMING',
          },
        });
      }
    }

    return RecurringService.formatOccurrence(updated);
  }
}
