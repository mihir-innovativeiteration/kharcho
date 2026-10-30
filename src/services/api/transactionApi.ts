import { authApi } from './authApi';
import { ApiResponse, ITransactionService } from '@/types/api';
import { Category } from '@/types/category';
import { PaymentMethod, Transaction, TransactionFilters } from '@/types/transaction';
import { localService } from '../mock';

export interface BackendCategory {
  id: string;
  userId?: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color?: string | null;
  isSystem: boolean;
}

export interface BackendPaymentMethod {
  id: string;
  userId?: string | null;
  name: string;
  type: string;
  details?: string | null;
  isSystem: boolean;
}

export interface BackendTransaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: string;
  description: string;
  categoryId: string;
  category?: BackendCategory;
  paymentMethodId?: string | null;
  paymentMethod?: BackendPaymentMethod | null;
  transactionDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps Backend category to mobile UI Category interface
 */
export function mapBackendCategory(cat: BackendCategory): Category {
  return {
    id: cat.id,
    name: cat.name,
    type: cat.type === 'INCOME' ? 'income' : 'expense',
    iconName: cat.icon,
    color: cat.color || (cat.type === 'INCOME' ? '#10B981' : '#F97316'),
    lightBg: `${cat.color || (cat.type === 'INCOME' ? '#10B981' : '#F97316')}15`,
    isCustom: !cat.isSystem,
  };
}

/**
 * Maps Backend transaction record to mobile UI Transaction interface
 */
export function mapBackendTransaction(tx: BackendTransaction): Transaction {
  let mappedPm: PaymentMethod = 'UPI';
  if (tx.paymentMethod?.name) {
    if (tx.paymentMethod.name.toLowerCase().includes('cash')) mappedPm = 'Cash';
    else if (tx.paymentMethod.name.toLowerCase().includes('card')) mappedPm = 'Card';
    else if (tx.paymentMethod.name.toLowerCase().includes('bank')) mappedPm = 'Net Banking';
    else mappedPm = 'UPI';
  }

  return {
    id: tx.id,
    title: tx.description,
    amount: parseFloat(tx.amount) || 0,
    type: tx.type === 'INCOME' ? 'income' : 'expense',
    categoryId: tx.categoryId,
    category: tx.category ? mapBackendCategory(tx.category) : undefined,
    date: tx.transactionDate,
    note: tx.notes || undefined,
    paymentMethod: mappedPm,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}

/**
 * Production Transaction API Client communicating with Node.js Express Backend
 */
export class LiveTransactionService implements ITransactionService {
  async getTransactions(filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> {
    if (!authApi.getAccessToken()) {
      return {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };
    }

    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') {
      params.append('type', filters.type.toUpperCase());
    }
    if (filters?.categoryId) {
      params.append('categoryId', filters.categoryId);
    }
    if (filters?.searchQuery) {
      params.append('search', filters.searchQuery);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if ((filters as any)?.limit) {
      params.append('limit', String((filters as any).limit));
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await authApi.request<{ success: boolean; data: BackendTransaction[] }>(
        `/transactions${queryString}`
      );

      const raw = res?.data !== undefined ? res.data : res;
      const items = Array.isArray(raw) ? raw : (Array.isArray(res?.data) ? res.data : []);

      return {
        success: true,
        data: items.map(mapBackendTransaction),
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('API getTransactions failed, returning empty list:', e);
      return {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    if (!authApi.getAccessToken()) {
      return localService.getTransactionById(id);
    }

    try {
      const res = await authApi.request<{ success: boolean; data: BackendTransaction }>(
        `/transactions/${id}`
      );

      const raw = ((res as any)?.data !== undefined ? (res as any).data : res) as BackendTransaction;
      return {
        success: true,
        data: mapBackendTransaction(raw),
        timestamp: new Date().toISOString(),
      };
    } catch {
      return localService.getTransactionById(id);
    }
  }

  async createTransaction(
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Transaction>> {
    if (!authApi.getAccessToken()) {
      return localService.createTransaction(payload);
    }

    const backendPayload = {
      type: payload.type.toUpperCase() as 'INCOME' | 'EXPENSE',
      amount: payload.amount.toFixed(2),
      currency: 'INR',
      description: payload.title,
      categoryId: payload.categoryId,
      paymentMethodId: payload.paymentMethod === 'Cash' 
        ? 'pm_cash' 
        : payload.paymentMethod === 'Card' 
          ? 'pm_debit_card' 
          : payload.paymentMethod === 'Net Banking'
            ? 'pm_bank_transfer'
            : 'pm_upi',
      transactionDate: payload.date || new Date().toISOString(),
      notes: payload.note || null,
    };

    const res = await authApi.request<{ success: boolean; data: BackendTransaction }>(
      '/transactions',
      {
        method: 'POST',
        body: JSON.stringify(backendPayload),
      }
    );

    const raw = ((res as any)?.data !== undefined ? (res as any).data : res) as BackendTransaction;
    return {
      success: true,
      data: mapBackendTransaction(raw),
      timestamp: new Date().toISOString(),
    };
  }

  async updateTransaction(
    id: string,
    payload: Partial<Transaction>
  ): Promise<ApiResponse<Transaction>> {
    if (!authApi.getAccessToken()) {
      return localService.updateTransaction(id, payload);
    }

    const backendPayload: any = {};
    if (payload.type) backendPayload.type = payload.type.toUpperCase();
    if (payload.amount !== undefined) backendPayload.amount = payload.amount.toFixed(2);
    if (payload.title) backendPayload.description = payload.title;
    if (payload.categoryId) backendPayload.categoryId = payload.categoryId;
    if (payload.date) backendPayload.transactionDate = payload.date;
    if (payload.note !== undefined) backendPayload.notes = payload.note;

    const res = await authApi.request<{ success: boolean; data: BackendTransaction }>(
      `/transactions/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(backendPayload),
      }
    );

    const rawUpdate = ((res as any)?.data !== undefined ? (res as any).data : res) as BackendTransaction;
    return {
      success: true,
      data: mapBackendTransaction(rawUpdate),
      timestamp: new Date().toISOString(),
    };
  }

  async deleteTransaction(id: string): Promise<ApiResponse<{ id: string }>> {
    if (!authApi.getAccessToken()) {
      return localService.deleteTransaction(id);
    }

    await authApi.request<{ success: boolean; data: { id: string } }>(
      `/transactions/${id}`,
      {
        method: 'DELETE',
      }
    );

    return {
      success: true,
      data: { id },
      timestamp: new Date().toISOString(),
    };
  }
}

export const liveTransactionService = new LiveTransactionService();
