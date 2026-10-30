import { Prisma } from '@prisma/client';

/**
 * Monetary precision and validation utility.
 * Enforces exact decimal arithmetic without JavaScript floating-point inaccuracies.
 */

// Max allowable single transaction: 100 Billion INR
export const MAX_TRANSACTION_AMOUNT = new Prisma.Decimal('100000000000.00');
export const MIN_TRANSACTION_AMOUNT = new Prisma.Decimal('0.01');

const AMOUNT_REGEX = /^\d+(\.\d{1,4})?$/;

/**
 * Validates and parses monetary amount string.
 * Rejects:
 * - Negative numbers
 * - Zero
 * - Scientific notation (e.g. 1e4)
 * - NaN / non-numeric
 * - More than 4 decimal places
 * - Exceeding maximum transaction limit
 */
export function validateAndParseAmount(amountInput: string | number | Prisma.Decimal): {
  valid: boolean;
  decimal?: Prisma.Decimal;
  error?: string;
} {
  const amountStr = typeof amountInput === 'number' 
    ? amountInput.toString() 
    : amountInput instanceof Prisma.Decimal 
      ? amountInput.toString() 
      : String(amountInput).trim();

  if (!amountStr || !AMOUNT_REGEX.test(amountStr)) {
    return {
      valid: false,
      error: 'Amount must be a positive decimal number with up to 4 decimal places (e.g. "250.00")',
    };
  }

  try {
    const dec = new Prisma.Decimal(amountStr);

    if (!dec.isFinite() || dec.isNaN()) {
      return { valid: false, error: 'Amount is not a valid finite number' };
    }

    if (dec.isZero() || dec.isNegative()) {
      return { valid: false, error: 'Amount must be strictly greater than zero' };
    }

    if (dec.lt(MIN_TRANSACTION_AMOUNT)) {
      return { valid: false, error: `Minimum amount is ${MIN_TRANSACTION_AMOUNT.toFixed(2)}` };
    }

    if (dec.gt(MAX_TRANSACTION_AMOUNT)) {
      return { valid: false, error: `Amount exceeds maximum limit of ${MAX_TRANSACTION_AMOUNT.toFixed(2)}` };
    }

    return { valid: true, decimal: dec };
  } catch {
    return { valid: false, error: 'Failed to parse monetary amount' };
  }
}

/**
 * Format decimal to safe 2-decimal string for API responses
 */
export function formatDecimal(decimal: Prisma.Decimal | string | number): string {
  if (decimal instanceof Prisma.Decimal) {
    return decimal.toFixed(2);
  }
  return new Prisma.Decimal(decimal || 0).toFixed(2);
}

/**
 * Exact decimal addition
 */
export function addDecimals(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.plus(b);
}

/**
 * Exact decimal subtraction (a - b)
 */
export function subtractDecimals(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.minus(b);
}
