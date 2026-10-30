import { ParseResult } from './ruleBasedParser.service.js';

export interface CategoryContext {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface PaymentMethodContext {
  id: string;
  name: string;
  type: string;
}

export interface ParserContext {
  locale?: string;
  timezone?: string;
  categories: CategoryContext[];
  paymentMethods: PaymentMethodContext[];
}

export interface IAITransactionParser {
  name: string;
  isAvailable(): boolean;
  parse(text: string, context: ParserContext): Promise<ParseResult>;
}
