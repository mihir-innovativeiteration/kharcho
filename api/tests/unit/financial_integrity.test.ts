import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  addDecimals,
  formatDecimal,
  MAX_TRANSACTION_AMOUNT,
  MIN_TRANSACTION_AMOUNT,
  subtractDecimals,
  validateAndParseAmount,
} from '../../src/utils/money.js';
import { RecurrenceService } from '../../src/services/recurrence.service.js';

describe('Financial Integrity & Decimal Precision Audit', () => {
  describe('Exact Decimal Arithmetic vs Floating-Point Imprecision', () => {
    it('accurately calculates 0.10 + 0.20 as exactly 0.30 without binary float artifact', () => {
      // Standard JS binary floating-point demonstration
      const floatSum = 0.1 + 0.2;
      expect(floatSum).not.toBe(0.3); // 0.30000000000000004

      // Kharcho Decimal arithmetic
      const dec1 = new Prisma.Decimal('0.10');
      const dec2 = new Prisma.Decimal('0.20');
      const decSum = addDecimals(dec1, dec2);

      expect(decSum.toString()).toBe('0.3');
      expect(formatDecimal(decSum)).toBe('0.30');
    });

    it('retains exact precision across 10,000 fractional transactions', () => {
      // Summing 0.07 ten thousand times should yield exactly 700.00
      let total = new Prisma.Decimal('0.00');
      const increment = new Prisma.Decimal('0.07');

      for (let i = 0; i < 10000; i++) {
        total = total.plus(increment);
      }

      expect(formatDecimal(total)).toBe('700.00');
      expect(total.equals(new Prisma.Decimal('700'))).toBe(true);
    });

    it('correctly calculates net cash flow with exact subtraction', () => {
      const income = new Prisma.Decimal('55432.85');
      const expense = new Prisma.Decimal('32145.40');

      const net = subtractDecimals(income, expense);
      expect(formatDecimal(net)).toBe('23287.45');

      // Inverted: when expense exceeds income
      const negativeNet = subtractDecimals(expense, income);
      expect(formatDecimal(negativeNet)).toBe('-23287.45');
    });
  });

  describe('Monetary Bounds & Anti-Malicious Input Validation', () => {
    it('accepts valid minimum transaction amount (0.01 INR)', () => {
      const result = validateAndParseAmount('0.01');
      expect(result.valid).toBe(true);
      expect(result.decimal?.toString()).toBe('0.01');
    });

    it('accepts valid large amounts within ceiling', () => {
      const result = validateAndParseAmount('9999999999.99');
      expect(result.valid).toBe(true);
    });

    it('rejects zero amount', () => {
      const result = validateAndParseAmount('0');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/greater than zero/i);
    });

    it('rejects negative amounts', () => {
      const result = validateAndParseAmount('-450.00');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/positive/i);
    });

    it('rejects scientific notation attacks (e.g. 1e12)', () => {
      const result = validateAndParseAmount('1e12');
      expect(result.valid).toBe(false);
    });

    it('rejects amounts exceeding 4 decimal places', () => {
      const result = validateAndParseAmount('100.12345');
      expect(result.valid).toBe(false);
    });

    it('rejects non-numeric values and SQL injection attempts', () => {
      expect(validateAndParseAmount('NaN').valid).toBe(false);
      expect(validateAndParseAmount('null').valid).toBe(false);
      expect(validateAndParseAmount("100' OR '1'='1").valid).toBe(false);
      expect(validateAndParseAmount('   ').valid).toBe(false);
    });

    it('rejects amounts exceeding maximum transaction ceiling', () => {
      const overCeiling = MAX_TRANSACTION_AMOUNT.plus(1).toString();
      const result = validateAndParseAmount(overCeiling);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exceeds maximum limit/i);
    });
  });

  describe('Calendar & Recurring Boundary Calculations', () => {
    it('handles leap year boundaries correctly (Feb 29 on leap year vs Feb 28 on normal year)', () => {
      // Leap year 2028: Jan 31 -> Feb 29
      const jan31_2028 = new Date('2028-01-31T10:00:00.000Z');
      const nextDueLeap = RecurrenceService.calculateNextDueDate(
        jan31_2028,
        'MONTHLY',
        1,
        jan31_2028
      );

      expect(nextDueLeap.toISOString().split('T')[0]).toBe('2028-02-29');

      // Non-leap year 2027: Jan 31 -> Feb 28
      const jan31_2027 = new Date('2027-01-31T10:00:00.000Z');
      const nextDueNonLeap = RecurrenceService.calculateNextDueDate(
        jan31_2027,
        'MONTHLY',
        1,
        jan31_2027
      );

      expect(nextDueNonLeap.toISOString().split('T')[0]).toBe('2027-02-28');
    });

    it('handles year-end rollover correctly (Dec 31 to Jan 31)', () => {
      const dec31_2026 = new Date('2026-12-31T12:00:00.000Z');
      const nextDue = RecurrenceService.calculateNextDueDate(
        dec31_2026,
        'MONTHLY',
        1,
        dec31_2026
      );

      expect(nextDue.toISOString().split('T')[0]).toBe('2027-01-31');
    });
  });
});
