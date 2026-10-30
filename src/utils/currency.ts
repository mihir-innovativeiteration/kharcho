import { APP_CONFIG } from '@/constants/config';

/**
 * Format a number into Indian Rupee representation.
 * Follows Indian numbering system (e.g. 1,23,45,678).
 *
 * @param amount Number in Rupees
 * @param options Formatting configuration
 */
export function formatINR(
  amount: number | null | undefined,
  options?: {
    showDecimals?: boolean;
    showSign?: boolean;
    compact?: boolean; // Formats as 1.5L or 2.3k
    symbol?: string;
  }
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '₹0';
  }

  const symbol = options?.symbol ?? APP_CONFIG.currency.symbol;
  const showDecimals = options?.showDecimals ?? false;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Compact mode for small cards / charts
  if (options?.compact) {
    if (absAmount >= 10000000) {
      // Crores
      const cr = (absAmount / 10000000).toFixed(1).replace(/\.0$/, '');
      const sign = isNegative ? '-' : options?.showSign ? '+' : '';
      return `${sign}${symbol}${cr} Cr`;
    }
    if (absAmount >= 100000) {
      // Lakhs
      const lk = (absAmount / 100000).toFixed(1).replace(/\.0$/, '');
      const sign = isNegative ? '-' : options?.showSign ? '+' : '';
      return `${sign}${symbol}${lk} L`;
    }
    if (absAmount >= 1000) {
      // Thousands
      const k = (absAmount / 1000).toFixed(1).replace(/\.0$/, '');
      const sign = isNegative ? '-' : options?.showSign ? '+' : '';
      return `${sign}${symbol}${k}k`;
    }
  }

  // Format with Indian grouping
  // Indian formatting puts comma after last 3 digits, then every 2 digits (e.g., 12,34,567.89)
  const integerPart = Math.floor(absAmount).toString();
  const decimalPart = Math.round((absAmount - Math.floor(absAmount)) * 100)
    .toString()
    .padStart(2, '0');

  let formattedInt = '';
  if (integerPart.length <= 3) {
    formattedInt = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${withCommas},${lastThree}`;
  }

  const formattedDecimal = showDecimals ? `.${decimalPart}` : '';
  const sign = isNegative ? '-' : options?.showSign ? '+' : '';

  return `${sign}${symbol}${formattedInt}${formattedDecimal}`;
}

/**
 * Convert Rupees to Paise integer to avoid floating point inaccuracies
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert Paise integer back to Rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Clean user text input into a valid financial number
 */
export function sanitizeCurrencyInput(input: string): string {
  // Allow only digits and a single decimal point
  const sanitized = input.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (parts.length === 2 && parts[1].length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return sanitized;
}
