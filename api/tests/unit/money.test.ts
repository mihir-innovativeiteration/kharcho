import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  addDecimals,
  formatDecimal,
  subtractDecimals,
  validateAndParseAmount,
  MAX_TRANSACTION_AMOUNT,
  MIN_TRANSACTION_AMOUNT,
} from '../../src/utils/money.js';

describe('Monetary Precision & Validation', () => {
  it('accepts valid positive decimal amounts with 2 to 4 decimal places', () => {
    const validInputs = ['10.50', '250', '9999.99', '125.1234', 500, new Prisma.Decimal('100.25')];
    for (const input of validInputs) {
      const res = validateAndParseAmount(input);
      expect(res.valid).toBe(true);
      expect(res.decimal).toBeDefined();
    }
  });

  it('rejects zero and negative amounts', () => {
    expect(validateAndParseAmount('0').valid).toBe(false);
    expect(validateAndParseAmount('0.00').valid).toBe(false);
    expect(validateAndParseAmount('-50').valid).toBe(false);
    expect(validateAndParseAmount('-0.01').valid).toBe(false);
  });

  it('rejects malformed, non-numeric, or scientific notation strings', () => {
    const invalidInputs = ['abc', '12.34.56', '1e5', 'NaN', 'Infinity', '', '   ', '12,500'];
    for (const input of invalidInputs) {
      const res = validateAndParseAmount(input);
      expect(res.valid).toBe(false);
    }
  });

  it('rejects amounts exceeding the 100 Billion ceiling', () => {
    const huge = MAX_TRANSACTION_AMOUNT.plus(1).toString();
    const res = validateAndParseAmount(huge);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds maximum limit');
  });

  it('performs exact decimal addition without floating point error', () => {
    // In JavaScript, 0.1 + 0.2 === 0.30000000000000004
    const a = new Prisma.Decimal('0.1');
    const b = new Prisma.Decimal('0.2');
    const sum = addDecimals(a, b);
    expect(sum.toString()).toBe('0.3');
    expect(formatDecimal(sum)).toBe('0.30');
  });

  it('performs exact decimal subtraction without floating point error', () => {
    // In JavaScript, 1.0 - 0.9 === 0.09999999999999998
    const a = new Prisma.Decimal('1.0');
    const b = new Prisma.Decimal('0.9');
    const diff = subtractDecimals(a, b);
    expect(diff.toString()).toBe('0.1');
    expect(formatDecimal(diff)).toBe('0.10');
  });

  it('serializes amounts to exactly 2 decimal places for financial responses', () => {
    expect(formatDecimal(new Prisma.Decimal('50'))).toBe('50.00');
    expect(formatDecimal(new Prisma.Decimal('123.456'))).toBe('123.46');
    expect(formatDecimal('1000.5')).toBe('1000.50');
  });
});
