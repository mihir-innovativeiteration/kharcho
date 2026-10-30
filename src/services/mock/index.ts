import {
  MOCK_BUDGETS,
  MOCK_DASHBOARD_SUMMARY,
  MOCK_INSIGHTS,
  MOCK_TRANSACTIONS,
  MOCK_USER_PROFILE,
} from './mockData';
import {
  ApiResponse,
  IBudgetService,
  IDashboardService,
  ITransactionService,
  IAuthService,
  UserProfile,
  DashboardSummary,
  InsightsData,
} from '@/types/api';
import { Budget, BudgetSummary } from '@/types/budget';
import { Transaction, TransactionFilters } from '@/types/transaction';
import { getCategoryById } from '@/constants/config/categories';

/**
 * Phase 1 Mock / Local Service Implementation.
 * Emulates the future Node.js REST API responses with typed contracts.
 */
class LocalMockService implements IAuthService, ITransactionService, IBudgetService, IDashboardService {
  private transactions: Transaction[] = [...MOCK_TRANSACTIONS];
  private budgets: Budget[] = [...MOCK_BUDGETS];
  private userProfile: UserProfile = { ...MOCK_USER_PROFILE };

  // Helper response wrapper
  private wrapResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Auth & User Profile ---
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.wrapResponse(this.userProfile);
  }

  async login(token: string): Promise<ApiResponse<UserProfile>> {
    return this.wrapResponse(this.userProfile, 'Mock login successful');
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.wrapResponse(undefined, 'Logged out');
  }

  // --- Transactions ---
  async getTransactions(filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> {
    let result = [...this.transactions];

    if (filters?.type && filters.type !== 'all') {
      result = result.filter((tx) => tx.type === filters.type);
    }

    if (filters?.categoryId) {
      result = result.filter((tx) => tx.categoryId === filters.categoryId);
    }

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (tx) =>
          tx.title.toLowerCase().includes(q) ||
          tx.note?.toLowerCase().includes(q) ||
          tx.category?.name.toLowerCase().includes(q)
      );
    }

    // Sort descending by date
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return this.wrapResponse(result);
  }

  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    const tx = this.transactions.find((t) => t.id === id);
    if (!tx) {
      throw new Error(`Transaction ${id} not found`);
    }
    return this.wrapResponse(tx);
  }

  async createTransaction(
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Transaction>> {
    const newTx: Transaction = {
      ...payload,
      id: `tx_${Date.now()}`,
      category: payload.category || getCategoryById(payload.categoryId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.unshift(newTx);

    // If it's an expense, update corresponding budget spent if present
    if (newTx.type === 'expense') {
      const budgetIndex = this.budgets.findIndex((b) => b.categoryId === newTx.categoryId);
      if (budgetIndex !== -1) {
        this.budgets[budgetIndex].spent += newTx.amount;
      }
    }

    return this.wrapResponse(newTx, 'Transaction created successfully');
  }

  async updateTransaction(id: string, payload: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction ${id} not found`);
    }
    const updated: Transaction = {
      ...this.transactions[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.transactions[index] = updated;
    return this.wrapResponse(updated, 'Transaction updated');
  }

  async deleteTransaction(id: string): Promise<ApiResponse<{ id: string }>> {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    return this.wrapResponse({ id }, 'Transaction deleted');
  }

  // --- Budgets ---
  async getBudgets(month?: string): Promise<ApiResponse<Budget[]>> {
    return this.wrapResponse(this.budgets);
  }

  async getBudgetSummary(month?: string): Promise<ApiResponse<BudgetSummary>> {
    const totalBudget = this.budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = this.budgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = Math.max(0, totalBudget - totalSpent);
    const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return this.wrapResponse({
      totalBudget,
      totalSpent,
      remaining,
      percentageUsed,
      isOverBudget: totalSpent > totalBudget,
    });
  }

  async createBudget(
    payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spent'>
  ): Promise<ApiResponse<Budget>> {
    const newBudget: Budget = {
      ...payload,
      id: `b_${Date.now()}`,
      spent: 0,
      category: getCategoryById(payload.categoryId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.budgets.push(newBudget);
    return this.wrapResponse(newBudget, 'Budget created');
  }

  async updateBudget(id: string, payload: Partial<Budget>): Promise<ApiResponse<Budget>> {
    const index = this.budgets.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Budget ${id} not found`);
    }
    const updated: Budget = {
      ...this.budgets[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.budgets[index] = updated;
    return this.wrapResponse(updated, 'Budget updated');
  }

  // --- Dashboard & Insights ---
  async getDashboardSummary(month?: string): Promise<ApiResponse<DashboardSummary>> {
    const totalIncome = this.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = this.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)) : 0;

    return this.wrapResponse({
      ...MOCK_DASHBOARD_SUMMARY,
      currentBalance,
      totalIncome,
      totalExpense,
      savingsRate,
      recentTransactions: this.transactions.slice(0, 5),
    });
  }

  async getInsights(period?: string): Promise<ApiResponse<InsightsData>> {
    return this.wrapResponse(MOCK_INSIGHTS);
  }

  // Reset to original mock state (useful for user profile settings reset)
  resetMockData() {
    this.transactions = [...MOCK_TRANSACTIONS];
    this.budgets = [...MOCK_BUDGETS];
  }

  // Clear data to test empty states
  clearAllData() {
    this.transactions = [];
    this.budgets = [];
  }
}

export const localService = new LocalMockService();
export * from './mockData';
