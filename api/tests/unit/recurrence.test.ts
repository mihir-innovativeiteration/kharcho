import { describe, it, expect } from 'vitest';
import { RecurrenceService } from '../../src/services/recurrence.service.js';

describe('Recurrence Calculation Engine', () => {
  it('correctly calculates daily schedules with interval', () => {
    const start = new Date(Date.UTC(2026, 9, 1, 10, 0, 0)); // Oct 1, 2026
    const next1 = RecurrenceService.calculateNextDueDate(start, 'DAILY', 1);
    expect(next1.toISOString()).toBe('2026-10-02T10:00:00.000Z');

    const next3 = RecurrenceService.calculateNextDueDate(start, 'DAILY', 3);
    expect(next3.toISOString()).toBe('2026-10-04T10:00:00.000Z');
  });

  it('correctly calculates weekly schedules with interval', () => {
    const start = new Date(Date.UTC(2026, 9, 1, 10, 0, 0)); // Oct 1, 2026
    const nextWeek = RecurrenceService.calculateNextDueDate(start, 'WEEKLY', 1);
    expect(nextWeek.toISOString()).toBe('2026-10-08T10:00:00.000Z');

    const biWeekly = RecurrenceService.calculateNextDueDate(start, 'WEEKLY', 2);
    expect(biWeekly.toISOString()).toBe('2026-10-15T10:00:00.000Z');
  });

  it('handles month-end policy for 31st dates correctly across short months', () => {
    const start = new Date(Date.UTC(2027, 0, 31, 12, 0, 0)); // Jan 31, 2027
    
    // Jan 31 -> Feb (non-leap year, 28 days)
    const feb = RecurrenceService.calculateNextDueDate(start, 'MONTHLY', 1, start);
    expect(feb.getUTCFullYear()).toBe(2027);
    expect(feb.getUTCMonth()).toBe(1); // February
    expect(feb.getUTCDate()).toBe(28);

    // Feb 28 -> Mar (March has 31 days, restored to 31)
    const mar = RecurrenceService.calculateNextDueDate(feb, 'MONTHLY', 1, start);
    expect(mar.getUTCFullYear()).toBe(2027);
    expect(mar.getUTCMonth()).toBe(2); // March
    expect(mar.getUTCDate()).toBe(31);

    // Mar 31 -> Apr (April has 30 days)
    const apr = RecurrenceService.calculateNextDueDate(mar, 'MONTHLY', 1, start);
    expect(apr.getUTCFullYear()).toBe(2027);
    expect(apr.getUTCMonth()).toBe(3); // April
    expect(apr.getUTCDate()).toBe(30);

    // Apr 30 -> May (May has 31 days)
    const may = RecurrenceService.calculateNextDueDate(apr, 'MONTHLY', 1, start);
    expect(may.getUTCFullYear()).toBe(2027);
    expect(may.getUTCMonth()).toBe(4); // May
    expect(may.getUTCDate()).toBe(31);
  });

  it('handles leap-year monthly schedules for Feb 29', () => {
    const start = new Date(Date.UTC(2028, 0, 31, 9, 30, 0)); // Jan 31, 2028 (2028 is a leap year)
    const feb = RecurrenceService.calculateNextDueDate(start, 'MONTHLY', 1, start);
    expect(feb.getUTCFullYear()).toBe(2028);
    expect(feb.getUTCMonth()).toBe(1);
    expect(feb.getUTCDate()).toBe(29); // Feb 29 in leap year
  });

  it('handles yearly schedules and leap year Feb 29 anchor day', () => {
    const leapDay = new Date(Date.UTC(2024, 1, 29, 0, 0, 0)); // Feb 29, 2024
    
    const year1 = RecurrenceService.calculateNextDueDate(leapDay, 'YEARLY', 1, leapDay);
    expect(year1.getUTCFullYear()).toBe(2025);
    expect(year1.getUTCMonth()).toBe(1);
    expect(year1.getUTCDate()).toBe(28); // Clamped to Feb 28 in non-leap year

    const year4 = RecurrenceService.calculateNextDueDate(leapDay, 'YEARLY', 4, leapDay);
    expect(year4.getUTCFullYear()).toBe(2028);
    expect(year4.getUTCMonth()).toBe(1);
    expect(year4.getUTCDate()).toBe(29); // Restored to Feb 29 in leap year 2028
  });

  it('generates occurrence preview and stops before end date', () => {
    const start = new Date(Date.UTC(2026, 0, 1, 0, 0, 0)); // Jan 1, 2026
    const end = new Date(Date.UTC(2026, 2, 15, 0, 0, 0)); // Mar 15, 2026

    const preview = RecurrenceService.generateOccurrencesPreview(start, 'MONTHLY', 1, 10, end);
    expect(preview.length).toBe(3); // Jan 1, Feb 1, Mar 1 (Apr 1 is after Mar 15)
    expect(preview[0].toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(preview[1].toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(preview[2].toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('produces stable occurrence keys', () => {
    const date = new Date(Date.UTC(2026, 9, 25, 14, 30, 0));
    const key = RecurrenceService.getOccurrenceKey('rule_123', date);
    expect(key).toBe('rule_123_2026-10-25');
  });
});
