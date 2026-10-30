import { authApi } from './authApi';
import { SavingsContribution, SavingsGoal } from '@/types/budget';

export interface BackendSavingsGoal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: string;
  totalSaved: string;
  remainingAmount: string;
  completionPercentage: number;
  currency: string;
  targetDate: string | null;
  icon: string | null;
  color: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  isCompleted: boolean;
  contributionsCount: number;
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: string;
  contributionDate: string;
  note: string | null;
  disclaimer: string;
  createdAt: string;
}

export function mapBackendGoal(g: BackendSavingsGoal): SavingsGoal {
  return {
    id: g.id,
    userId: g.userId,
    name: g.name,
    description: g.description,
    targetAmount: parseFloat(g.targetAmount) || 0,
    totalSaved: parseFloat(g.totalSaved) || 0,
    remainingAmount: parseFloat(g.remainingAmount) || 0,
    completionPercentage: g.completionPercentage,
    currency: g.currency,
    targetDate: g.targetDate,
    icon: g.icon || 'PiggyBank',
    color: g.color || '#10B981',
    status: g.status,
    isCompleted: g.isCompleted,
    contributionsCount: g.contributionsCount,
    disclaimer: g.disclaimer,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function mapBackendContribution(c: BackendContribution): SavingsContribution {
  return {
    id: c.id,
    userId: c.userId,
    goalId: c.goalId,
    amount: parseFloat(c.amount) || 0,
    contributionDate: c.contributionDate,
    note: c.note,
    disclaimer: c.disclaimer,
    createdAt: c.createdAt,
  };
}

export class SavingsApiClient {
  async getGoals(status?: string): Promise<SavingsGoal[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await authApi.request<any>(
      `/savings-goals${query}`
    );
    const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    return items.map(mapBackendGoal);
  }

  async getGoalById(id: string): Promise<SavingsGoal & { contributions?: SavingsContribution[] }> {
    const res = await authApi.request<any>(`/savings-goals/${id}`);
    const goalData = res?.data !== undefined ? res.data : res;
    const goal = mapBackendGoal(goalData);
    const contributions = (goalData.contributions || []).map(mapBackendContribution);
    return { ...goal, contributions };
  }

  async createGoal(payload: {
    name: string;
    description?: string | null;
    targetAmount: string | number;
    currency?: string;
    targetDate?: string | null;
    icon?: string;
    color?: string;
  }): Promise<SavingsGoal> {
    const amountStr =
      typeof payload.targetAmount === 'number' ? payload.targetAmount.toFixed(2) : payload.targetAmount;
    const res = await authApi.request<any>(
      '/savings-goals',
      {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          targetAmount: amountStr,
        }),
      }
    );
    const goalData = res?.data !== undefined ? res.data : res;
    return mapBackendGoal(goalData);
  }

  async updateGoal(
    id: string,
    payload: {
      name?: string;
      description?: string | null;
      targetAmount?: string | number;
      targetDate?: string | null;
      icon?: string;
      color?: string;
      status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    }
  ): Promise<SavingsGoal> {
    const body: any = { ...payload };
    if (payload.targetAmount !== undefined) {
      body.targetAmount =
        typeof payload.targetAmount === 'number' ? payload.targetAmount.toFixed(2) : payload.targetAmount;
    }
    const res = await authApi.request<any>(
      `/savings-goals/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    );
    const goalData = res?.data !== undefined ? res.data : res;
    return mapBackendGoal(goalData);
  }

  async deleteGoal(id: string): Promise<{ id: string; deleted: boolean }> {
    const res = await authApi.request<any>(
      `/savings-goals/${id}`,
      { method: 'DELETE' }
    );
    return res?.data !== undefined ? res.data : res;
  }

  async addContribution(
    goalId: string,
    payload: {
      amount: string | number;
      contributionDate?: string;
      note?: string | null;
    }
  ): Promise<{ contribution: SavingsContribution; goal: SavingsGoal }> {
    const amountStr = typeof payload.amount === 'number' ? payload.amount.toFixed(2) : payload.amount;
    const res = await authApi.request<any>(`/savings-goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        amount: amountStr,
      }),
    });
    const data = res?.data !== undefined ? res.data : res;
    return {
      contribution: mapBackendContribution(data.contribution),
      goal: mapBackendGoal(data.goal),
    };
  }

  async getContributions(goalId: string): Promise<SavingsContribution[]> {
    const res = await authApi.request<any>(
      `/savings-goals/${goalId}/contributions`
    );
    const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    return items.map(mapBackendContribution);
  }

  async deleteContribution(
    goalId: string,
    contributionId: string
  ): Promise<{ deletedContributionId: string; goal: SavingsGoal }> {
    const res = await authApi.request<any>(`/savings-goals/${goalId}/contributions/${contributionId}`, {
      method: 'DELETE',
    });
    const data = res?.data !== undefined ? res.data : res;
    return {
      deletedContributionId: data.deletedContributionId,
      goal: mapBackendGoal(data.goal),
    };
  }
}

export const savingsApiClient = new SavingsApiClient();
