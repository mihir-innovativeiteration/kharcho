import { describe, it, expect } from 'vitest';
import { FinanceService } from '../../src/services/finance.service.js';
import { Prisma } from '@prisma/client';
import { addDecimals, subtractDecimals, formatDecimal } from '../../src/utils/money.js';

describe('Financial Analytics & Dashboard Calculations', () => {
  it('correctly calculates default calendar month boundaries', () => {
    const range = FinanceService.getDateRange();
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.start.getUTCDate()).toBe(1);
    expect(range.start.getUTCHours()).toBe(0);
    expect(range.start.getUTCMinutes()).toBe(0);
    expect(range.end.getUTCHours()).toBe(23);
    expect(range.end.getUTCMinutes()).toBe(59);
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
  });

  it('respects explicitly provided start and end dates', () => {
    const range = FinanceService.getDateRange('2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.999Z');
    expect(range.start.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-01-31T23:59:59.999Z');
  });

  it('performs exact decimal arithmetic without floating point inaccuracy', () => {
    const d1 = new Prisma.Decimal('0.10');
    const d2 = new Prisma.Decimal('0.20');
    const sum = addDecimals(d1, d2);
    expect(formatDecimal(sum)).toBe('0.30');

    const d3 = new Prisma.Decimal('100.00');
    const d4 = new Prisma.Decimal('45.55');
    const diff = subtractDecimals(d3, d4);
    expect(formatDecimal(diff)).toBe('54.45');
  });

  it('handles negative net activity correctly when expenses exceed income', () => {
    const totalIncome = new Prisma.Decimal('15000.00');
    const totalExpenses = new Prisma.Decimal('22500.50');
    const netActivity = subtractDecimals(totalIncome, totalExpenses);
    expect(formatDecimal(netActivity)).toBe('-7500.50');
    expect(netActivity.isNegative()).toBe(true);
  });

  it('safely handles zero previous-period comparison without division by zero', () => {
    // If previous expense was 0, change percentage must be 0, never NaN or Infinity
    const prevExpense = new Prisma.Decimal('0.00');
    const currentExpense = new Prisma.Decimal('5000.00');
    
    let changePercentage = 0;
    if (prevExpense.greaterThan(0)) {
      changePercentage = currentExpense
        .minus(prevExpense)
        .dividedBy(prevExpense)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
    }
    expect(changePercentage).toBe(0);
    expect(Number.isFinite(changePercentage)).toBe(true);
    expect(Number.isNaN(changePercentage)).toBe(false);
  });

  it('computes accurate percentage increase when previous period has non-zero amount', () => {
    const prevExpense = new Prisma.Decimal('4000.00');
    const currentExpense = new Prisma.Decimal('5000.00');
    
    const changePercentage = currentExpense
      .minus(prevExpense)
      .dividedBy(prevExpense)
      .times(100)
      .toDecimalPlaces(1)
      .toNumber();
      
    expect(changePercentage).toBe(25.0);
  });
});
