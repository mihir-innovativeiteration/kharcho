import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { addDecimals, formatDecimal, subtractDecimals } from '../utils/money.js';
import { FinanceQueryParams } from '../validators/finance.validator.js';

export class FinanceService {
  /**
   * Determine exact start and end date boundaries for query
   */
  public static getDateRange(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const now = new Date();
    // Default to current calendar month: from 1st of month 00:00:00.000 to end of month 23:59:59.999
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    return { start, end };
  }

  /**
   * Get financial summary with previous period comparison
   */
  static async getSummary(userId: string, query: FinanceQueryParams, db: any = prisma) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const currency = query.currency || 'INR';

    // Current period transactions
    const transactions = await db.transaction.findMany({
      where: {
        userId,
        currency,
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let totalIncome = new Prisma.Decimal('0.00');
    let totalExpense = new Prisma.Decimal('0.00');

    for (const tx of transactions) {
      const amountDec = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome = addDecimals(totalIncome, amountDec);
      } else if (tx.type === 'EXPENSE') {
        totalExpense = addDecimals(totalExpense, amountDec);
      }
    }

    const netActivity = subtractDecimals(totalIncome, totalExpense);

    // Calculate previous period for safe trend comparison
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const prevTransactions = await db.transaction.findMany({
      where: {
        userId,
        currency,
        transactionDate: {
          gte: prevStart,
          lte: prevEnd,
        },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let prevIncome = new Prisma.Decimal('0.00');
    let prevExpense = new Prisma.Decimal('0.00');

    for (const tx of prevTransactions) {
      const amountDec = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);
      if (tx.type === 'INCOME') {
        prevIncome = addDecimals(prevIncome, amountDec);
      } else if (tx.type === 'EXPENSE') {
        prevExpense = addDecimals(prevExpense, amountDec);
      }
    }

    let incomeChangePercentage = 0;
    if (!prevIncome.isZero()) {
      incomeChangePercentage = Number(
        totalIncome.minus(prevIncome).dividedBy(prevIncome).times(100).toFixed(1)
      );
    }

    let expenseChangePercentage = 0;
    if (!prevExpense.isZero()) {
      expenseChangePercentage = Number(
        totalExpense.minus(prevExpense).dividedBy(prevExpense).times(100).toFixed(1)
      );
    }

    return {
      totalIncome: formatDecimal(totalIncome),
      totalExpenses: formatDecimal(totalExpense),
      netActivity: formatDecimal(netActivity),
      transactionCount: transactions.length,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      currency,
      previousPeriod: {
        startDate: prevStart.toISOString(),
        endDate: prevEnd.toISOString(),
        totalIncome: formatDecimal(prevIncome),
        totalExpenses: formatDecimal(prevExpense),
        netActivity: formatDecimal(subtractDecimals(prevIncome, prevExpense)),
      },
      changes: {
        incomePercentage: incomeChangePercentage,
        expensePercentage: expenseChangePercentage,
      },
      note: 'Totals represent transaction activity within the specified period, not real-time bank balance.',
    };
  }

  /**
   * Category-wise breakdown of expenses and income
   */
  static async getCategoryBreakdown(userId: string, query: FinanceQueryParams, db: any = prisma) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const currency = query.currency || 'INR';

    const transactions = await db.transaction.findMany({
      where: {
        userId,
        currency,
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        category: true,
      },
    });

    let totalExpenseDec = new Prisma.Decimal('0.00');
    let totalIncomeDec = new Prisma.Decimal('0.00');

    const expenseMap = new Map<string, { category: any; total: Prisma.Decimal; count: number }>();
    const incomeMap = new Map<string, { category: any; total: Prisma.Decimal; count: number }>();

    for (const tx of transactions) {
      const amountDec = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);
      const isExpense = tx.type === 'EXPENSE';
      const targetMap = isExpense ? expenseMap : incomeMap;

      if (isExpense) {
        totalExpenseDec = addDecimals(totalExpenseDec, amountDec);
      } else {
        totalIncomeDec = addDecimals(totalIncomeDec, amountDec);
      }

      const categoryId = tx.categoryId;
      const existing = targetMap.get(categoryId);
      if (existing) {
        existing.total = addDecimals(existing.total, amountDec);
        existing.count += 1;
      } else {
        targetMap.set(categoryId, {
          category: tx.category || {
            id: categoryId,
            name: 'General',
            icon: 'CircleDollarSign',
            color: '#64748B',
          },
          total: amountDec,
          count: 1,
        });
      }
    }

    const formatCategoryList = (
      map: Map<string, { category: any; total: Prisma.Decimal; count: number }>,
      grandTotal: Prisma.Decimal
    ) => {
      const list = Array.from(map.values()).map((entry) => {
        let percentage = '0.00';
        if (!grandTotal.isZero()) {
          percentage = entry.total.dividedBy(grandTotal).times(100).toFixed(2);
        }

        return {
          categoryId: entry.category.id,
          name: entry.category.name,
          icon: entry.category.icon,
          color: entry.category.color,
          total: formatDecimal(entry.total),
          percentage,
          count: entry.count,
        };
      });

      // Sort by total descending
      list.sort((a, b) => Number(b.total) - Number(a.total));
      return list;
    };

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      currency,
      expenses: {
        total: formatDecimal(totalExpenseDec),
        breakdown: formatCategoryList(expenseMap, totalExpenseDec),
      },
      income: {
        total: formatDecimal(totalIncomeDec),
        breakdown: formatCategoryList(incomeMap, totalIncomeDec),
      },
    };
  }

  /**
   * Daily / monthly timeline trends for charting
   */
  static async getTrends(userId: string, query: FinanceQueryParams, db: any = prisma) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const currency = query.currency || 'INR';

    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const isMonthly = query.groupBy === 'month' || durationDays > 45;

    const transactions = await db.transaction.findMany({
      where: {
        userId,
        currency,
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Create continuous buckets for requested date range
    const bucketMap = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal; label: string }>();

    if (isMonthly) {
      // Generate monthly buckets (e.g. 2026-05, 2026-06, etc.)
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
      const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      while (cursor.getTime() <= endMonth.getTime()) {
        const year = cursor.getUTCFullYear();
        const monthNum = cursor.getUTCMonth();
        const key = `${year}-${String(monthNum + 1).padStart(2, '0')}`;
        const label = `${monthNames[monthNum]} ${year}`;

        bucketMap.set(key, {
          income: new Prisma.Decimal('0.00'),
          expense: new Prisma.Decimal('0.00'),
          label,
        });

        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    } else {
      // Generate daily buckets
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

      while (cursor.getTime() <= endDay.getTime()) {
        const key = cursor.toISOString().split('T')[0];
        const dayOfMonth = cursor.getUTCDate();
        const label = `${dayOfMonth}`;

        bucketMap.set(key, {
          income: new Prisma.Decimal('0.00'),
          expense: new Prisma.Decimal('0.00'),
          label,
        });

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    // Populate transaction data into buckets
    for (const tx of transactions) {
      const txDate = tx.transactionDate instanceof Date ? tx.transactionDate : new Date(tx.transactionDate);
      const key = isMonthly
        ? `${txDate.getUTCFullYear()}-${String(txDate.getUTCMonth() + 1).padStart(2, '0')}`
        : txDate.toISOString().split('T')[0];

      const amountDec = tx.amount instanceof Prisma.Decimal ? tx.amount : new Prisma.Decimal(tx.amount);

      let record = bucketMap.get(key);
      if (!record) {
        // Fallback in case out-of-range transaction slipped through
        record = {
          income: new Prisma.Decimal('0.00'),
          expense: new Prisma.Decimal('0.00'),
          label: key,
        };
        bucketMap.set(key, record);
      }

      if (tx.type === 'INCOME') {
        record.income = addDecimals(record.income, amountDec);
      } else {
        record.expense = addDecimals(record.expense, amountDec);
      }
    }

    const timeline = Array.from(bucketMap.entries()).map(([key, rec]) => ({
      date: key,
      label: rec.label,
      income: formatDecimal(rec.income),
      expense: formatDecimal(rec.expense),
      net: formatDecimal(subtractDecimals(rec.income, rec.expense)),
    }));

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      currency,
      groupBy: isMonthly ? 'month' : 'day',
      timeline,
    };
  }
}
