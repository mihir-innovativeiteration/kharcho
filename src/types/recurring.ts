export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
export type OccurrenceStatus = 'UPCOMING' | 'DUE' | 'AWAITING_CONFIRMATION' | 'PAID' | 'SKIPPED' | 'FAILED';

export interface RecurringCategory {
  id: string;
  name: string;
  icon?: string | null;
  iconName?: string | null;
  color?: string | null;
}

export interface RecurringPaymentMethod {
  id: string;
  name: string;
  type: string;
}

export interface RecurringRule {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  providerName?: string | null;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  currency: string;
  categoryId?: string | null;
  category?: RecurringCategory | null;
  paymentMethodId?: string | null;
  paymentMethod?: RecurringPaymentMethod | null;
  frequency: RecurringFrequency;
  interval: number;
  startDate: string;
  nextDueAt: string;
  endDate?: string | null;
  timezone: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  autoPost: boolean;
  status: RecurringStatus;
  occurrencesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringOccurrence {
  id: string;
  recurringRuleId: string;
  userId: string;
  occurrenceKey: string;
  scheduledAt: string;
  status: OccurrenceStatus;
  transactionId?: string | null;
  transaction?: {
    id: string;
    amount: number;
    type: string;
    description: string;
    transactionDate: string;
  } | null;
  rule?: RecurringRule;
  reminderSentAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringReminder {
  id: string;
  userId: string;
  occurrenceId: string;
  title: string;
  message: string;
  leadDays: number;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface RecurringEstimates {
  monthlyExpenses: number;
  monthlyIncome: number;
  monthlyNet: number;
  currency: string;
  notice: string;
}

export interface CreateRecurringRuleInput {
  title: string;
  description?: string;
  providerName?: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number | string;
  currency?: string;
  categoryId?: string | null;
  paymentMethodId?: string | null;
  frequency: RecurringFrequency;
  interval?: number;
  startDate: string;
  endDate?: string | null;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  autoPost?: boolean;
}

export interface UpdateRecurringRuleInput {
  title?: string;
  description?: string | null;
  providerName?: string | null;
  amount?: number | string;
  categoryId?: string | null;
  paymentMethodId?: string | null;
  frequency?: RecurringFrequency;
  interval?: number;
  endDate?: string | null;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  autoPost?: boolean;
  status?: RecurringStatus;
}

export interface ConfirmPaidInput {
  paymentMethodId?: string | null;
  paidAt?: string;
  notes?: string;
}
