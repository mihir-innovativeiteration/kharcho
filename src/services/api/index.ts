import { localService } from '../mock';
import { ApiResponse, IAuthService, IBudgetService, IDashboardService, ITransactionService, UserProfile } from '@/types/api';
import { authApi } from './authApi';
import { liveTransactionService } from './transactionApi';
import { liveDashboardService } from './financeApi';
import { liveBudgetService, budgetApiClient } from './budgetApi';
import { savingsApiClient } from './savingsApi';
import { alertApiClient } from './alertApi';
import { recurringApiClient } from './recurringApi';
import { aiTransactionApiClient } from './aiTransactionApi';
import { syncApiClient } from './syncApi';
import { notificationApiClient } from './notificationApi';

export const liveAuthService: IAuthService = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    if (!authApi.getAccessToken()) {
      return {
        success: true,
        data: {
          id: '',
          name: '',
          email: '',
          currency: 'INR',
          locale: 'en',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
    try {
      const me = await authApi.getMe();
      return {
        success: true,
        data: {
          id: me.id,
          name: me.name,
          email: me.email,
          currency: 'INR',
          locale: me.preferredLanguage || 'en',
          createdAt: me.createdAt || new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: true,
        data: {
          id: '',
          name: '',
          email: '',
          currency: 'INR',
          locale: 'en',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  },
  async login(token: string) {
    return localService.login(token);
  },
  async logout() {
    return localService.logout();
  },
};

/**
 * Service Layer Abstraction.
 * Dynamically uses LiveTransactionService, LiveDashboardService, LiveBudgetService, and LiveAuthService when authenticated.
 */
export const authService: IAuthService = liveAuthService;
export const transactionService: ITransactionService = liveTransactionService;
export const budgetService: IBudgetService = liveBudgetService;
export const dashboardService: IDashboardService = liveDashboardService;

export {
  localService,
  liveTransactionService,
  liveDashboardService,
  liveBudgetService,
  budgetApiClient,
  savingsApiClient,
  alertApiClient,
  recurringApiClient,
  aiTransactionApiClient,
  syncApiClient,
  notificationApiClient,
};
