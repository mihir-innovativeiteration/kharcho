import { authApi } from './authApi';
import { BudgetAlert } from '@/types/budget';

export interface BackendBudgetAlert {
  id: string;
  userId: string;
  budgetId: string;
  budgetName: string;
  budgetType: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color?: string | null;
  } | null;
  thresholdPercent: number;
  periodKey: string;
  triggeredAt: string;
  readAt: string | null;
  isRead: boolean;
  createdAt: string;
}

export function mapBackendAlert(a: BackendBudgetAlert): BudgetAlert {
  return {
    id: a.id,
    userId: a.userId,
    budgetId: a.budgetId,
    budgetName: a.budgetName,
    budgetType: a.budgetType,
    category: a.category
      ? {
          id: a.category.id,
          name: a.category.name,
          icon: a.category.icon,
          color: a.category.color || '#F97316',
        }
      : null,
    thresholdPercent: a.thresholdPercent,
    periodKey: a.periodKey,
    triggeredAt: a.triggeredAt,
    readAt: a.readAt,
    isRead: a.isRead,
    createdAt: a.createdAt,
  };
}

export class AlertApiClient {
  async getAlerts(isRead?: boolean, page = 1, limit = 20): Promise<{ items: BudgetAlert[]; unreadCount: number }> {
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', String(isRead));
    params.append('page', String(page));
    params.append('limit', String(limit));

    const res = await authApi.request<any>(`/budget-alerts?${params.toString()}`);
    const rawData = res?.data !== undefined ? res.data : res;
    const items = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.items) ? rawData.items : []);
    const unreadCount = res?.unreadCount ?? rawData?.unreadCount ?? 0;

    return {
      items: items.map(mapBackendAlert),
      unreadCount,
    };
  }

  async markAlertRead(id: string): Promise<BudgetAlert> {
    const res = await authApi.request<any>(
      `/budget-alerts/${id}/read`,
      { method: 'PATCH' }
    );
    const data = res?.data !== undefined ? res.data : res;
    return mapBackendAlert(data);
  }

  async markAllAlertsRead(): Promise<void> {
    await authApi.request<any>('/budget-alerts/read-all', {
      method: 'PATCH',
    });
  }
}

export const alertApiClient = new AlertApiClient();
