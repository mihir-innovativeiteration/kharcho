import { authApi } from './authApi';
import { ApiResponse, IBudgetService } from '@/types/api';
import { Budget, BudgetSummary } from '@/types/budget';
import { localService } from '../mock';

export interface BackendBudget {
  id: string;
  userId: string;
  name: string;
  type: 'OVERALL' | 'CATEGORY';
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color?: string | null;
  } | null;
  amount: string;
  spent: string;
  remaining: string;
  currency: string;
  period: 'MONTHLY' | 'CUSTOM';
  periodKey: string;
  startDate?: string | null;
  endDate?: string | null;
  utilizationPercentage: number;
  isExceeded: boolean;
  thresholdStatus: 'NORMAL' | 'WARNING_50' | 'WARNING_80' | 'EXCEEDED';
  warningThresholds: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendBudgetSummary {
  periodKey: string;
  totalBudget: string;
  totalSpent: string;
  remaining: string;
  percentageUsed: number;
  isOverBudget: boolean;
  activeBudgetsCount: number;
  hasOverallBudget: boolean;
}

export function mapBackendBudget(b: BackendBudget): Budget {
  return {
    id: b.id,
    userId: b.userId,
    name: b.name,
    type: b.type,
    categoryId: b.categoryId || '',
    category: b.category
      ? {
          id: b.category.id,
          name: b.category.name,
          type: 'expense',
          iconName: b.category.icon,
          color: b.category.color || '#F97316',
          lightBg: '#FFF7ED',
        }
      : undefined,
    amount: parseFloat(b.amount) || 0,
    spent: parseFloat(b.spent) || 0,
    remaining: parseFloat(b.remaining) || 0,
    month: b.periodKey,
    period: b.period,
    periodKey: b.periodKey,
    startDate: b.startDate || undefined,
    endDate: b.endDate || undefined,
    utilizationPercentage: b.utilizationPercentage,
    isExceeded: b.isExceeded,
    thresholdStatus: b.thresholdStatus,
    warningThresholds: b.warningThresholds,
    isActive: b.isActive,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function mapBackendBudgetSummary(s: BackendBudgetSummary): BudgetSummary {
  return {
    periodKey: s.periodKey,
    totalBudget: parseFloat(s.totalBudget) || 0,
    totalSpent: parseFloat(s.totalSpent) || 0,
    remaining: parseFloat(s.remaining) || 0,
    percentageUsed: s.percentageUsed,
    isOverBudget: s.isOverBudget,
    activeBudgetsCount: s.activeBudgetsCount,
    hasOverallBudget: s.hasOverallBudget,
  };
}

export class BudgetApiClient {
  async getBudgets(month?: string): Promise<Budget[]> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await authApi.request<any>(`/budgets${query}`);
    const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    return items.map(mapBackendBudget);
  }

  async getBudgetSummary(month?: string): Promise<BudgetSummary> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await authApi.request<any>(
      `/budgets/summary${query}`
    );
    const summaryData = res?.data !== undefined ? res.data : res;
    return mapBackendBudgetSummary(summaryData);
  }

  async getBudgetById(id: string, month?: string): Promise<Budget> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await authApi.request<any>(
      `/budgets/${id}${query}`
    );
    const budgetData = res?.data !== undefined ? res.data : res;
    return mapBackendBudget(budgetData);
  }

  async createBudget(payload: {
    name: string;
    type: 'OVERALL' | 'CATEGORY';
    categoryId?: string | null;
    amount: string | number;
    currency?: string;
    period?: 'MONTHLY' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
    warningThresholds?: number[];
  }): Promise<Budget> {
    const amountStr = typeof payload.amount === 'number' ? payload.amount.toFixed(2) : payload.amount;
    const res = await authApi.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        amount: amountStr,
      }),
    });
    const budgetData = res?.data !== undefined ? res.data : res;
    return mapBackendBudget(budgetData);
  }

  async updateBudget(
    id: string,
    payload: {
      name?: string;
      amount?: string | number;
      categoryId?: string | null;
      warningThresholds?: number[];
      isActive?: boolean;
    }
  ): Promise<Budget> {
    const body: any = { ...payload };
    if (payload.amount !== undefined) {
      body.amount = typeof payload.amount === 'number' ? payload.amount.toFixed(2) : payload.amount;
    }
    const res = await authApi.request<any>(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const budgetData = res?.data !== undefined ? res.data : res;
    return mapBackendBudget(budgetData);
  }

  async deleteBudget(id: string): Promise<{ id: string; deleted: boolean }> {
    const res = await authApi.request<any>(
      `/budgets/${id}`,
      { method: 'DELETE' }
    );
    return res?.data !== undefined ? res.data : res;
  }
}

export const budgetApiClient = new BudgetApiClient();

export const liveBudgetService: IBudgetService = {
  async getBudgets(month?: string): Promise<ApiResponse<Budget[]>> {
    const token = authApi.getAccessToken();
    if (!token) {
      return {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
    try {
      const budgets = await budgetApiClient.getBudgets(month);
      return {
        success: true,
        data: budgets,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('liveBudgetService getBudgets failed:', e);
      return {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getBudgetSummary(month?: string): Promise<ApiResponse<BudgetSummary>> {
    const token = authApi.getAccessToken();
    if (!token) {
      return {
        success: true,
        data: {
          periodKey: month || '',
          totalBudget: 0,
          totalSpent: 0,
          remaining: 0,
          percentageUsed: 0,
          isOverBudget: false,
          activeBudgetsCount: 0,
          hasOverallBudget: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
    try {
      const summary = await budgetApiClient.getBudgetSummary(month);
      return {
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('liveBudgetService getBudgetSummary failed:', e);
      return {
        success: true,
        data: {
          periodKey: month || '',
          totalBudget: 0,
          totalSpent: 0,
          remaining: 0,
          percentageUsed: 0,
          isOverBudget: false,
          activeBudgetsCount: 0,
          hasOverallBudget: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  async createBudget(
    payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spent'>
  ): Promise<ApiResponse<Budget>> {
    if (!authApi.getAccessToken()) {
      return localService.createBudget(payload);
    }
    const budget = await budgetApiClient.createBudget({
      name: payload.name || payload.category?.name || 'Budget',
      type: payload.type || (payload.categoryId ? 'CATEGORY' : 'OVERALL'),
      categoryId: payload.categoryId || null,
      amount: payload.amount,
      warningThresholds: payload.warningThresholds || [50, 80, 100],
    });
    return {
      success: true,
      data: budget,
      timestamp: new Date().toISOString(),
    };
  },

  async updateBudget(id: string, payload: Partial<Budget>): Promise<ApiResponse<Budget>> {
    if (!authApi.getAccessToken()) {
      return localService.updateBudget(id, payload);
    }
    const budget = await budgetApiClient.updateBudget(id, {
      name: payload.name,
      amount: payload.amount,
      categoryId: payload.categoryId,
      warningThresholds: payload.warningThresholds,
      isActive: payload.isActive,
    });
    return {
      success: true,
      data: budget,
      timestamp: new Date().toISOString(),
    };
  },
};
