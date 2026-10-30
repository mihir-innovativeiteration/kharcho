import { prisma } from '../config/db.js';
import { QueryAlertsParams } from '../validators/alert.validator.js';

export class BudgetAlertService {
  /**
   * Format alert record for API response
   */
  static formatAlert(alert: any) {
    return {
      id: alert.id,
      userId: alert.userId,
      budgetId: alert.budgetId,
      budgetName: alert.budget?.name || 'Budget',
      budgetType: alert.budget?.type || 'CATEGORY',
      category: alert.budget?.category
        ? {
            id: alert.budget.category.id,
            name: alert.budget.category.name,
            icon: alert.budget.category.icon,
            color: alert.budget.category.color,
          }
        : null,
      thresholdPercent: alert.thresholdPercent,
      periodKey: alert.periodKey,
      triggeredAt: alert.triggeredAt instanceof Date ? alert.triggeredAt.toISOString() : alert.triggeredAt,
      readAt: alert.readAt instanceof Date ? alert.readAt.toISOString() : alert.readAt,
      isRead: Boolean(alert.readAt),
      createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : alert.createdAt,
    };
  }

  /**
   * List in-app budget alerts with pagination and read filtering
   */
  static async listAlerts(userId: string, query: QueryAlertsParams, db: any = prisma) {
    const where: any = { userId };
    if (query.isRead !== undefined) {
      where.readAt = query.isRead ? { not: null } : null;
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, unreadCount, items] = await Promise.all([
      db.budgetAlert.count({ where }),
      db.budgetAlert.count({ where: { userId, readAt: null } }),
      db.budgetAlert.findMany({
        where,
        skip,
        take,
        orderBy: { triggeredAt: 'desc' },
        include: {
          budget: {
            include: {
              category: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map(this.formatAlert),
      unreadCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Mark a single alert as read (isolated strictly to owner)
   */
  static async markAlertRead(userId: string, alertId: string, db: any = prisma) {
    const alert = await db.budgetAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert || alert.userId !== userId) {
      const err: any = new Error('Alert not found');
      err.statusCode = 404;
      throw err;
    }

    const updated = await db.budgetAlert.update({
      where: { id: alertId },
      data: { readAt: new Date() },
      include: {
        budget: {
          include: { category: true },
        },
      },
    });

    return this.formatAlert(updated);
  }

  /**
   * Mark all unread alerts as read for user
   */
  static async markAllAlertsRead(userId: string, db: any = prisma) {
    await db.budgetAlert.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Evaluate thresholds for a user's budgets based on current spending
   */
  static async evaluateBudgetThresholds(
    userId: string,
    budgetId: string,
    thresholds: number[],
    utilizationPercent: number,
    periodKey: string,
    db: any = prisma
  ) {
    // Check if user has alerts enabled
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { budgetAlertsEnabled: true },
    });

    if (user && user.budgetAlertsEnabled === false) {
      return [];
    }

    const createdAlerts = [];

    for (const threshold of thresholds) {
      if (utilizationPercent >= threshold) {
        // Idempotent creation: check if already exists
        const existing = await db.budgetAlert.findFirst({
          where: {
            budgetId,
            thresholdPercent: threshold,
            periodKey,
          },
        });

        if (!existing) {
          try {
            const newAlert = await db.budgetAlert.create({
              data: {
                userId,
                budgetId,
                thresholdPercent: threshold,
                periodKey,
                triggeredAt: new Date(),
              },
            });
            createdAlerts.push(newAlert);
          } catch (e: any) {
            // Unique constraint violation (P2002) is safe to ignore in concurrent requests
            if (e?.code !== 'P2002') {
              console.warn('Alert creation error:', e);
            }
          }
        }
      }
    }

    return createdAlerts;
  }
}
