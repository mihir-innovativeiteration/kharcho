export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export class RecurrenceService {
  /**
   * Helper to check if a year is a leap year
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Get maximum days in a given year and month (0-indexed month)
   */
  static getDaysInMonth(year: number, monthIdx: number): number {
    const daysInMonths = [31, this.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysInMonths[monthIdx];
  }

  /**
   * Generate stable occurrence key for rule and scheduled date
   */
  static getOccurrenceKey(ruleId: string, scheduledDate: Date): string {
    const yyyy = scheduledDate.getUTCFullYear();
    const mm = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(scheduledDate.getUTCDate()).padStart(2, '0');
    return `${ruleId}_${yyyy}-${mm}-${dd}`;
  }

  /**
   * Calculate next due date strictly based on recurrence frequency and interval
   * with consistent end-of-month and leap-year policies.
   */
  static calculateNextDueDate(
    currentDate: Date,
    frequency: RecurringFrequency,
    interval = 1,
    originalStartDate?: Date
  ): Date {
    const date = new Date(currentDate);
    const start = originalStartDate ? new Date(originalStartDate) : date;
    const anchorDay = start.getUTCDate();

    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const ms = date.getUTCMilliseconds();

    switch (frequency) {
      case 'DAILY': {
        const next = new Date(date);
        next.setUTCDate(next.getUTCDate() + interval);
        return next;
      }

      case 'WEEKLY': {
        const next = new Date(date);
        next.setUTCDate(next.getUTCDate() + interval * 7);
        return next;
      }

      case 'MONTHLY': {
        const targetYear = date.getUTCFullYear();
        const targetMonthIdx = date.getUTCMonth() + interval;

        // Calculate normalized year and month
        const nextYear = targetYear + Math.floor(targetMonthIdx / 12);
        const nextMonthIdx = ((targetMonthIdx % 12) + 12) % 12;

        const maxDaysInNextMonth = this.getDaysInMonth(nextYear, nextMonthIdx);
        // End-of-month policy: clamp to last day of month if anchorDay exceeds max days
        const targetDay = Math.min(anchorDay, maxDaysInNextMonth);

        return new Date(Date.UTC(nextYear, nextMonthIdx, targetDay, hours, minutes, seconds, ms));
      }

      case 'YEARLY': {
        const nextYear = date.getUTCFullYear() + interval;
        const monthIdx = start.getUTCMonth();
        const maxDaysInMonth = this.getDaysInMonth(nextYear, monthIdx);
        const targetDay = Math.min(anchorDay, maxDaysInMonth);

        return new Date(Date.UTC(nextYear, monthIdx, targetDay, hours, minutes, seconds, ms));
      }

      default: {
        const next = new Date(date);
        next.setMonth(next.getMonth() + interval);
        return next;
      }
    }
  }

  /**
   * Check if a due date is past the end date
   */
  static isPastEndDate(dueDate: Date, endDate?: Date | null): boolean {
    if (!endDate) return false;
    return dueDate.getTime() > new Date(endDate).getTime();
  }

  /**
   * Generate preview of upcoming occurrences before saving or editing a rule
   */
  static generateOccurrencesPreview(
    startDate: Date,
    frequency: RecurringFrequency,
    interval = 1,
    count = 5,
    endDate?: Date | null
  ): Date[] {
    const dates: Date[] = [];
    let current = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    for (let i = 0; i < count; i++) {
      if (end && current.getTime() > end.getTime()) {
        break;
      }
      dates.push(new Date(current));
      current = this.calculateNextDueDate(current, frequency, interval, startDate);
    }

    return dates;
  }
}
