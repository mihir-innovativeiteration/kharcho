import { prisma } from '../config/db.js';
import { formatDecimal } from '../utils/money.js';

export class ReminderService {
  /**
   * Format reminder for API response
   */
  static formatReminder(rem: any) {
    return {
      id: rem.id,
      userId: rem.userId,
      ruleId: rem.ruleId,
      occurrenceId: rem.occurrenceId,
      title: rem.title,
      message: rem.message,
      amount: formatDecimal(rem.amount),
      currency: rem.currency,
      dueDate: rem.dueDate instanceof Date ? rem.dueDate.toISOString() : rem.dueDate,
      isRead: rem.isRead,
      readAt: rem.readAt instanceof Date ? rem.readAt.toISOString() : rem.readAt,
      createdAt: rem.createdAt instanceof Date ? rem.createdAt.toISOString() : rem.createdAt,
    };
  }

  /**
   * List reminders with unread count
   */
  static async listReminders(userId: string, isRead?: boolean, db: any = prisma) {
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [items, unreadCount] = await Promise.all([
      db.recurringReminder.findMany({
        where,
        orderBy: { dueDate: 'asc' },
      }),
      db.recurringReminder.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items: items.map(this.formatReminder),
      unreadCount,
    };
  }

  /**
   * Mark single reminder as read
   */
  static async markRead(userId: string, reminderId: string, db: any = prisma) {
    const reminder = await db.recurringReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder || reminder.userId !== userId) {
      const err: any = new Error('Reminder not found');
      err.statusCode = 404;
      throw err;
    }

    const updated = await db.recurringReminder.update({
      where: { id: reminderId },
      data: { isRead: true, readAt: new Date() },
    });

    return this.formatReminder(updated);
  }

  /**
   * Mark all reminders as read for user
   */
  static async markAllRead(userId: string, db: any = prisma) {
    await db.recurringReminder.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }
}
