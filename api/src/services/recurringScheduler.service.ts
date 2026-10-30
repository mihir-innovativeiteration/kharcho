import { prisma } from '../config/db.js';
import { formatDecimal } from '../utils/money.js';
import { RecurrenceService } from './recurrence.service.js';
import { RecurringService } from './recurring.service.js';

export class RecurringSchedulerService {
  private static isRunning = false;

  /**
   * Run one scheduler pass over all active recurring rules, occurrences, and reminders
   * Protected against concurrent overlapping runs.
   */
  static async processSchedulerTick(now = new Date(), db: any = prisma) {
    if (this.isRunning) {
      return { skipped: true, reason: 'Previous scheduler pass is still in progress' };
    }

    this.isRunning = true;
    let occurrencesCreated = 0;
    let remindersCreated = 0;
    let autoPostedCount = 0;

    try {
      // 1. Find active rules
      const activeRules = await db.recurringRule.findMany({
        where: { status: 'ACTIVE' },
      });

      for (const rule of activeRules) {
        // Ensure occurrence exists for rule's nextDueAt
        const key = RecurrenceService.getOccurrenceKey(rule.id, rule.nextDueAt);
        const existingOcc = await db.recurringOccurrence.findFirst({
          where: { recurringRuleId: rule.id, occurrenceKey: key },
        });

        if (!existingOcc && !RecurrenceService.isPastEndDate(rule.nextDueAt, rule.endDate)) {
          const occStatus = rule.nextDueAt.getTime() <= now.getTime() ? 'DUE' : 'UPCOMING';
          await db.recurringOccurrence.create({
            data: {
              recurringRuleId: rule.id,
              userId: rule.userId,
              occurrenceKey: key,
              scheduledAt: rule.nextDueAt,
              status: occStatus,
            },
          });
          occurrencesCreated++;
        }
      }

      // 2. Identify occurrences in reminder window
      const pendingOccurrences = await db.recurringOccurrence.findMany({
        where: {
          status: { in: ['UPCOMING', 'DUE'] },
          reminderSentAt: null,
        },
        include: { rule: true },
      });

      for (const occ of pendingOccurrences) {
        const rule = occ.rule;
        if (!rule || !rule.reminderEnabled || rule.status !== 'ACTIVE') continue;

        const reminderWindowMs = (rule.reminderDaysBefore || 0) * 24 * 60 * 60 * 1000;
        const triggerTime = new Date(occ.scheduledAt.getTime() - reminderWindowMs);

        if (now.getTime() >= triggerTime.getTime()) {
          // Idempotent reminder creation: check if already exists
          const existingReminder = await db.recurringReminder.findFirst({
            where: { userId: occ.userId, occurrenceId: occ.id },
          });

          if (!existingReminder) {
            try {
              const dueFormatted = occ.scheduledAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              await db.recurringReminder.create({
                data: {
                  userId: occ.userId,
                  ruleId: rule.id,
                  occurrenceId: occ.id,
                  title: `${rule.title} Due Soon`,
                  message: `Scheduled ${rule.type.toLowerCase()} of ${rule.currency} ${formatDecimal(rule.amount)} is due on ${dueFormatted}.`,
                  amount: rule.amount,
                  currency: rule.currency,
                  dueDate: occ.scheduledAt,
                  isRead: false,
                },
              });
              remindersCreated++;
            } catch (e: any) {
              // Ignore unique constraint conflict
              if (e?.code !== 'P2002') console.warn('Reminder creation error:', e);
            }
          }

          // Mark reminder sent on occurrence
          await db.recurringOccurrence.update({
            where: { id: occ.id },
            data: { reminderSentAt: now },
          });
        }
      }

      // 3. Process Auto-Post rules
      const autoPostOccurrences = await db.recurringOccurrence.findMany({
        where: {
          status: { in: ['UPCOMING', 'DUE'] },
          scheduledAt: { lte: now },
          rule: { autoPost: true, status: 'ACTIVE' },
        },
        include: { rule: true },
      });

      for (const occ of autoPostOccurrences) {
        try {
          await RecurringService.confirmPaid(
            occ.userId,
            occ.id,
            { notes: `Auto-posted recurring payment for ${occ.rule.title}` },
            db
          );
          autoPostedCount++;
        } catch (e) {
          console.warn(`Auto-post error for occurrence ${occ.id}:`, e);
        }
      }

      return {
        success: true,
        occurrencesCreated,
        remindersCreated,
        autoPostedCount,
        timestamp: now.toISOString(),
      };
    } finally {
      this.isRunning = false;
    }
  }
}
