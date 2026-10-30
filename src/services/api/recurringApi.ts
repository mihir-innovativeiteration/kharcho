import { authApi } from './authApi';
import {
  ConfirmPaidInput,
  CreateRecurringRuleInput,
  RecurringEstimates,
  RecurringOccurrence,
  RecurringReminder,
  RecurringRule,
  UpdateRecurringRuleInput,
} from '@/types/recurring';

export interface BackendRecurringRule {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  providerName: string | null;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: string;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string | null;
  } | null;
  paymentMethodId: string | null;
  paymentMethod?: {
    id: string;
    name: string;
    type: string;
  } | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  startDate: string;
  nextDueAt: string;
  endDate: string | null;
  timezone: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  autoPost: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
  occurrencesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOccurrence {
  id: string;
  recurringRuleId: string;
  userId: string;
  occurrenceKey: string;
  scheduledAt: string;
  status: 'UPCOMING' | 'DUE' | 'AWAITING_CONFIRMATION' | 'PAID' | 'SKIPPED' | 'FAILED';
  transactionId: string | null;
  transaction?: {
    id: string;
    amount: string;
    type: string;
    description: string;
    transactionDate: string;
  } | null;
  rule?: BackendRecurringRule;
  reminderSentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendReminder {
  id: string;
  userId: string;
  occurrenceId: string;
  title: string;
  message: string;
  leadDays: number;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

async function isUserAuthenticated(): Promise<boolean> {
  return Boolean(authApi.getAccessToken() || (await authApi.getStoredRefreshToken()));
}

export function mapBackendRule(r: BackendRecurringRule): RecurringRule {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    providerName: r.providerName,
    type: r.type,
    amount: parseFloat(r.amount) || 0,
    currency: r.currency,
    categoryId: r.categoryId,
    category: r.category
      ? {
          id: r.category.id,
          name: r.category.name,
          iconName: r.category.icon,
          icon: r.category.icon,
          color: r.category.color || '#3B82F6',
        }
      : null,
    paymentMethodId: r.paymentMethodId,
    paymentMethod: r.paymentMethod
      ? {
          id: r.paymentMethod.id,
          name: r.paymentMethod.name,
          type: r.paymentMethod.type,
        }
      : null,
    frequency: r.frequency,
    interval: r.interval,
    startDate: r.startDate,
    nextDueAt: r.nextDueAt,
    endDate: r.endDate,
    timezone: r.timezone,
    reminderEnabled: r.reminderEnabled,
    reminderDaysBefore: r.reminderDaysBefore,
    autoPost: r.autoPost,
    status: r.status,
    occurrencesCount: r.occurrencesCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function mapBackendOccurrence(o: BackendOccurrence): RecurringOccurrence {
  return {
    id: o.id,
    recurringRuleId: o.recurringRuleId,
    userId: o.userId,
    occurrenceKey: o.occurrenceKey,
    scheduledAt: o.scheduledAt,
    status: o.status,
    transactionId: o.transactionId,
    transaction: o.transaction
      ? {
          id: o.transaction.id,
          amount: parseFloat(o.transaction.amount) || 0,
          type: o.transaction.type,
          description: o.transaction.description,
          transactionDate: o.transaction.transactionDate,
        }
      : null,
    rule: o.rule ? mapBackendRule(o.rule) : undefined,
    reminderSentAt: o.reminderSentAt,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export function mapBackendReminder(rem: BackendReminder): RecurringReminder {
  return {
    id: rem.id,
    userId: rem.userId,
    occurrenceId: rem.occurrenceId,
    title: rem.title,
    message: rem.message,
    leadDays: rem.leadDays,
    isRead: rem.isRead,
    readAt: rem.readAt,
    createdAt: rem.createdAt,
  };
}

// Fallback preview data when user is exploring or unauthenticated
const PREVIEW_RULES: RecurringRule[] = [
  {
    id: 'rule-preview-1',
    userId: 'preview-user',
    title: 'Apartment Rent',
    providerName: 'Landlord',
    type: 'EXPENSE',
    amount: 22000,
    currency: 'INR',
    categoryId: 'cat_rent',
    category: {
      id: 'cat_rent',
      name: 'Rent & Housing',
      iconName: 'Home',
      icon: 'Home',
      color: '#3B82F6',
    },
    frequency: 'MONTHLY',
    interval: 1,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    nextDueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    timezone: 'Asia/Kolkata',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    autoPost: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-preview-2',
    userId: 'preview-user',
    title: 'Netflix Premium & Cloud',
    providerName: 'Netflix',
    type: 'EXPENSE',
    amount: 649,
    currency: 'INR',
    categoryId: 'cat_subscriptions',
    category: {
      id: 'cat_subscriptions',
      name: 'Subscriptions',
      iconName: 'Tv',
      icon: 'Tv',
      color: '#EC4899',
    },
    frequency: 'MONTHLY',
    interval: 1,
    startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    nextDueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    timezone: 'Asia/Kolkata',
    reminderEnabled: true,
    reminderDaysBefore: 2,
    autoPost: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-preview-3',
    userId: 'preview-user',
    title: 'Monthly Salary',
    providerName: 'Employer',
    type: 'INCOME',
    amount: 85000,
    currency: 'INR',
    categoryId: 'cat_salary',
    category: {
      id: 'cat_salary',
      name: 'Salary',
      iconName: 'Briefcase',
      icon: 'Briefcase',
      color: '#10B981',
    },
    frequency: 'MONTHLY',
    interval: 1,
    startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
    nextDueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    timezone: 'Asia/Kolkata',
    reminderEnabled: true,
    reminderDaysBefore: 1,
    autoPost: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class RecurringApiClient {
  /**
   * List recurring rules with projected monthly estimates
   */
  async getRules(filters?: {
    status?: string;
    type?: string;
    frequency?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: RecurringRule[];
    estimates: RecurringEstimates;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      return {
        items: PREVIEW_RULES,
        estimates: {
          monthlyExpenses: 22649,
          monthlyIncome: 85000,
          monthlyNet: 62351,
          currency: 'INR',
          notice: 'Estimated monthly recurring totals based on active rules. These are projections, not confirmed bank transactions.',
        },
        pagination: { page: 1, limit: 20, total: PREVIEW_RULES.length, totalPages: 1 },
      };
    }

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.frequency) params.append('frequency', filters.frequency);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule[];
      estimates: {
        monthlyExpenses: string;
        monthlyIncome: string;
        monthlyNet: string;
        currency: string;
        notice: string;
      };
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/recurring-rules?${params.toString()}`);

    return {
      items: (res.data || []).map(mapBackendRule),
      estimates: {
        monthlyExpenses: parseFloat(res.estimates?.monthlyExpenses) || 0,
        monthlyIncome: parseFloat(res.estimates?.monthlyIncome) || 0,
        monthlyNet: parseFloat(res.estimates?.monthlyNet) || 0,
        currency: res.estimates?.currency || 'INR',
        notice: res.estimates?.notice || '',
      },
      pagination: res.pagination,
    };
  }

  /**
   * Get single rule by ID
   */
  async getRule(id: string): Promise<RecurringRule & { occurrences: RecurringOccurrence[] }> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      const found = PREVIEW_RULES.find((r) => r.id === id) || PREVIEW_RULES[0];
      return {
        ...found,
        occurrences: [
          {
            id: 'occ-preview-1',
            recurringRuleId: found.id,
            userId: found.userId,
            occurrenceKey: `${found.id}-2026-11`,
            scheduledAt: found.nextDueAt,
            status: 'UPCOMING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    }

    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule & { occurrences: BackendOccurrence[] };
    }>(`/recurring-rules/${id}`);

    const base = mapBackendRule(res.data);
    return {
      ...base,
      occurrences: (res.data.occurrences || []).map(mapBackendOccurrence),
    };
  }

  /**
   * Create recurring rule
   */
  async createRule(input: CreateRecurringRuleInput): Promise<RecurringRule> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      const created: RecurringRule = {
        id: `rule-${Date.now()}`,
        userId: 'preview-user',
        title: input.title,
        description: input.description,
        providerName: input.providerName,
        type: input.type,
        amount: typeof input.amount === 'string' ? parseFloat(input.amount) || 0 : input.amount,
        currency: input.currency || 'INR',
        categoryId: input.categoryId,
        frequency: input.frequency,
        interval: input.interval || 1,
        startDate: input.startDate,
        nextDueAt: input.startDate,
        endDate: input.endDate,
        timezone: 'Asia/Kolkata',
        reminderEnabled: input.reminderEnabled ?? true,
        reminderDaysBefore: input.reminderDaysBefore ?? 1,
        autoPost: input.autoPost ?? false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      PREVIEW_RULES.unshift(created);
      return created;
    }

    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule;
    }>('/recurring-rules', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return mapBackendRule(res.data);
  }

  /**
   * Update recurring rule
   */
  async updateRule(id: string, input: UpdateRecurringRuleInput): Promise<RecurringRule> {
    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule;
    }>(`/recurring-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });

    return mapBackendRule(res.data);
  }

  /**
   * Pause recurring rule
   */
  async pauseRule(id: string): Promise<RecurringRule> {
    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule;
    }>(`/recurring-rules/${id}/pause`, {
      method: 'POST',
    });

    return mapBackendRule(res.data);
  }

  /**
   * Resume recurring rule
   */
  async resumeRule(id: string): Promise<RecurringRule> {
    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule;
    }>(`/recurring-rules/${id}/resume`, {
      method: 'POST',
    });

    return mapBackendRule(res.data);
  }

  /**
   * Cancel recurring rule
   */
  async cancelRule(id: string): Promise<RecurringRule> {
    const res = await authApi.request<{
      success: boolean;
      data: BackendRecurringRule;
    }>(`/recurring-rules/${id}/cancel`, {
      method: 'POST',
    });

    return mapBackendRule(res.data);
  }

  /**
   * Delete recurring rule
   */
  async deleteRule(id: string): Promise<void> {
    await authApi.request(`/recurring-rules/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get upcoming occurrences (e.g. for Home screen widget)
   */
  async getUpcomingOccurrences(days = 7): Promise<RecurringOccurrence[]> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      return PREVIEW_RULES.map((rule, idx) => ({
        id: `occ-preview-${idx}`,
        recurringRuleId: rule.id,
        userId: rule.userId,
        occurrenceKey: `${rule.id}-${idx}`,
        scheduledAt: rule.nextDueAt,
        status: 'UPCOMING',
        rule,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    const res = await authApi.request<{
      success: boolean;
      data: BackendOccurrence[];
    }>(`/recurring-occurrences/upcoming?days=${days}`);

    return (res.data || []).map(mapBackendOccurrence);
  }

  /**
   * List occurrences with filters
   */
  async listOccurrences(filters?: {
    ruleId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: RecurringOccurrence[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters?.ruleId) params.append('ruleId', filters.ruleId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await authApi.request<{
      success: boolean;
      data: BackendOccurrence[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/recurring-occurrences?${params.toString()}`);

    return {
      items: (res.data || []).map(mapBackendOccurrence),
      pagination: res.pagination,
    };
  }

  /**
   * Confirm paid (IDEMPOTENT)
   */
  async confirmPaid(
    occurrenceId: string,
    input: ConfirmPaidInput = {}
  ): Promise<{
    alreadyPaid: boolean;
    occurrence: RecurringOccurrence;
    transaction: any;
    nextDueAt?: string | null;
    message: string;
  }> {
    const res = await authApi.request<{
      success: boolean;
      data: {
        alreadyPaid: boolean;
        occurrence: BackendOccurrence;
        transaction: any;
        nextDueAt?: string | null;
        message: string;
      };
    }>(`/recurring-occurrences/${occurrenceId}/confirm-paid`, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return {
      alreadyPaid: res.data.alreadyPaid,
      occurrence: mapBackendOccurrence(res.data.occurrence),
      transaction: res.data.transaction,
      nextDueAt: res.data.nextDueAt,
      message: res.data.message,
    };
  }

  /**
   * Skip occurrence
   */
  async skipOccurrence(occurrenceId: string): Promise<RecurringOccurrence> {
    const res = await authApi.request<{
      success: boolean;
      data: BackendOccurrence;
    }>(`/recurring-occurrences/${occurrenceId}/skip`, {
      method: 'POST',
    });

    return mapBackendOccurrence(res.data);
  }

  /**
   * Get in-app reminders
   */
  async getReminders(isRead?: boolean): Promise<{ items: RecurringReminder[]; unreadCount: number }> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      return { items: [], unreadCount: 0 };
    }

    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', String(isRead));

    const res = await authApi.request<{
      success: boolean;
      data: BackendReminder[];
      unreadCount: number;
    }>(`/reminders?${params.toString()}`);

    return {
      items: (res.data || []).map(mapBackendReminder),
      unreadCount: res.unreadCount || 0,
    };
  }

  /**
   * Mark reminder read
   */
  async markReminderRead(id: string): Promise<RecurringReminder> {
    const res = await authApi.request<{
      success: boolean;
      data: BackendReminder;
    }>(`/reminders/${id}/read`, {
      method: 'POST',
    });

    return mapBackendReminder(res.data);
  }

  /**
   * Mark all reminders read
   */
  async markAllRemindersRead(): Promise<void> {
    await authApi.request('/reminders/read-all', {
      method: 'POST',
    });
  }
}

export const recurringApiClient = new RecurringApiClient();
