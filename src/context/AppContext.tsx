import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { APP_CONFIG } from '@/constants/config';
import { authApi } from '@/services/api/authApi';
import { authService, budgetApiClient, budgetService, dashboardService, localService, transactionService } from '@/services/api';
import { storage } from '@/services/storage';
import { DashboardSummary, InsightsData, UserProfile } from '@/types/api';
import { Budget, BudgetSummary } from '@/types/budget';
import { Transaction, TransactionFilters } from '@/types/transaction';
import { LocalTransaction } from '@/types/sync';
import { sqliteService } from '@/services/storage/sqliteService';
import { networkMonitor } from '@/services/sync/networkMonitor';
import { syncEngine } from '@/services/sync/syncEngine';
import { useAuth } from '@/context/AuthContext';

interface AppContextType {
  // Onboarding
  hasCompletedOnboarding: boolean | null; // null while loading
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;

  // Preview Data Mode
  showPreviewData: boolean;
  setShowPreviewData: (enabled: boolean) => Promise<void>;
  resetToMockData: () => Promise<void>;
  clearAllToEmptyState: () => Promise<void>;

  // User Profile
  userProfile: UserProfile | null;

  // Transactions State
  transactions: Transaction[];
  isTransactionsLoading: boolean;
  transactionsError: string | null;
  refreshTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budgets State
  budgets: Budget[];
  budgetSummary: BudgetSummary | null;
  isBudgetsLoading: boolean;
  budgetsError: string | null;
  refreshBudgets: () => Promise<void>;
  addBudget: (payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spent'>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;

  // Dashboard & Insights
  dashboardSummary: DashboardSummary | null;
  isDashboardLoading: boolean;
  insights: InsightsData | null;
  isInsightsLoading: boolean;
  refreshDashboard: () => Promise<void>;
  refreshInsights: (period?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showPreviewData, setShowPreviewDataState] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [isBudgetsLoading, setIsBudgetsLoading] = useState<boolean>(true);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);

  // Dashboard & Insights
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState<boolean>(true);

  // Load initial persistent settings and records
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const onboardingDone = await storage.getItem(APP_CONFIG.storageKeys.hasCompletedOnboarding);
        if (isMounted) setHasCompletedOnboarding(onboardingDone === 'true');

        const previewEnabled = await storage.getItem(APP_CONFIG.storageKeys.showPreviewData);
        const hasToken = Boolean(authApi.getAccessToken());
        if (isMounted) {
          setShowPreviewDataState(hasToken ? false : previewEnabled === 'true');
        }

        const [profileRes, txRes, bList, bSum, dRes, iRes] = await Promise.all([
          authService.getProfile(),
          transactionService.getTransactions(),
          budgetService.getBudgets(),
          budgetService.getBudgetSummary(),
          dashboardService.getDashboardSummary(),
          dashboardService.getInsights(),
        ]);

        if (isMounted) {
          setUserProfile(profileRes.data);
          setTransactions(txRes.data);
          setBudgets(bList.data);
          setBudgetSummary(bSum.data);
          setDashboardSummary(dRes.data);
          setInsights(iRes.data);
          setIsTransactionsLoading(false);
          setIsBudgetsLoading(false);
          setIsDashboardLoading(false);
          setIsInsightsLoading(false);
        }
      } catch (e) {
        console.warn('Initialization error:', e);
        if (isMounted) {
          setHasCompletedOnboarding(false);
          setIsTransactionsLoading(false);
          setIsBudgetsLoading(false);
          setIsDashboardLoading(false);
          setIsInsightsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshTransactions = useCallback(async (filters?: TransactionFilters) => {
    setIsTransactionsLoading(true);
    setTransactionsError(null);

    const isOnline = networkMonitor.getCachedOnline();
    if (!isOnline && user?.id) {
      try {
        const localRows = await sqliteService.getLocalTransactions(user.id);
        if (localRows.length > 0) {
          setTransactions(
            localRows.map((r) => ({
              id: r.id,
              title: r.title,
              amount: r.amount,
              type: r.type,
              categoryId: r.categoryId,
              date: r.date,
              note: r.note,
              paymentMethod: r.paymentMethod,
              syncStatus: r.syncStatus,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            }))
          );
          setIsTransactionsLoading(false);
          return;
        }
      } catch {
        // fallback
      }
    }

    try {
      const res = await transactionService.getTransactions(filters);
      setTransactions(res.data);

      if (user?.id && res.data.length > 0) {
        for (const tx of res.data) {
          await sqliteService
            .saveLocalTransaction(
              {
                id: tx.id,
                serverId: tx.id,
                userId: user.id,
                type: tx.type,
                amount: tx.amount,
                currency: 'INR',
                title: tx.title,
                categoryId: tx.categoryId,
                paymentMethod: tx.paymentMethod,
                date: tx.date,
                note: tx.note,
                syncStatus: 'SYNCED',
                clientMutationId: `server-${tx.id}`,
                version: 1,
                createdAt: tx.createdAt,
                updatedAt: tx.updatedAt,
              },
              false
            )
            .catch(() => {});
        }
      }
    } catch {
      if (user?.id) {
        try {
          const localRows = await sqliteService.getLocalTransactions(user.id);
          if (localRows.length > 0) {
            setTransactions(
              localRows.map((r) => ({
                id: r.id,
                title: r.title,
                amount: r.amount,
                type: r.type,
                categoryId: r.categoryId,
                date: r.date,
                note: r.note,
                paymentMethod: r.paymentMethod,
                syncStatus: r.syncStatus,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
              }))
            );
            setIsTransactionsLoading(false);
            return;
          }
        } catch {
          // safe ignore
        }
      }
      setTransactionsError('Unable to fetch transactions. Please try again.');
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [user]);

  const refreshBudgets = useCallback(async () => {
    setIsBudgetsLoading(true);
    setBudgetsError(null);
    try {
      const [bList, bSum] = await Promise.all([
        budgetService.getBudgets(),
        budgetService.getBudgetSummary(),
      ]);
      setBudgets(bList.data);
      setBudgetSummary(bSum.data);
    } catch {
      setBudgetsError('Unable to load budgets. Please try again.');
    } finally {
      setIsBudgetsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      const res = await dashboardService.getDashboardSummary();
      setDashboardSummary(res.data);
    } catch (e) {
      console.warn('Dashboard summary error:', e);
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  const refreshInsights = useCallback(async (periodStr?: string) => {
    setIsInsightsLoading(true);
    try {
      const res = await dashboardService.getInsights(periodStr);
      setInsights(res.data);
    } catch (e) {
      console.warn('Insights error:', e);
    } finally {
      setIsInsightsLoading(false);
    }
  }, []);

  const prevUserIdRef = useRef<string | undefined>(user?.id);
  // Synchronize live data whenever the authenticated user changes (signup, login, logout)
  useEffect(() => {
    if (prevUserIdRef.current === user?.id) return;
    prevUserIdRef.current = user?.id;

    let isSubscribed = true;
    const reloadUserData = async () => {
      try {
        const [txRes, bList, bSum, dRes, iRes] = await Promise.all([
          transactionService.getTransactions(),
          budgetService.getBudgets(),
          budgetService.getBudgetSummary(),
          dashboardService.getDashboardSummary(),
          dashboardService.getInsights(),
        ]);
        if (isSubscribed) {
          setTransactions(txRes.data);
          setBudgets(bList.data);
          setBudgetSummary(bSum.data);
          setDashboardSummary(dRes.data);
          setInsights(iRes.data);
        }
      } catch {
        // safe fallback
      }
    };

    void reloadUserData();
    return () => {
      isSubscribed = false;
    };
  }, [user?.id]);

  const completeOnboarding = async () => {
    await storage.setItem(APP_CONFIG.storageKeys.hasCompletedOnboarding, 'true');
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = async () => {
    await storage.removeItem(APP_CONFIG.storageKeys.hasCompletedOnboarding);
    setHasCompletedOnboarding(false);
  };

  const setShowPreviewData = async (enabled: boolean) => {
    setShowPreviewDataState(enabled);
    await storage.setItem(APP_CONFIG.storageKeys.showPreviewData, enabled ? 'true' : 'false');
    if (enabled) {
      localService.resetMockData();
    } else {
      localService.clearAllData();
    }
    await Promise.all([refreshTransactions(), refreshBudgets(), refreshDashboard(), refreshInsights()]);
  };

  const resetToMockData = async () => {
    localService.resetMockData();
    setShowPreviewDataState(true);
    await storage.setItem(APP_CONFIG.storageKeys.showPreviewData, 'true');
    await Promise.all([refreshTransactions(), refreshBudgets(), refreshDashboard(), refreshInsights()]);
  };

  const clearAllToEmptyState = async () => {
    localService.clearAllData();
    setShowPreviewDataState(false);
    await storage.setItem(APP_CONFIG.storageKeys.showPreviewData, 'false');
    await Promise.all([refreshTransactions(), refreshBudgets(), refreshDashboard(), refreshInsights()]);
  };

  const addTransaction = async (
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> => {
    const isOnline = networkMonitor.getCachedOnline();
    const currentUserId = user?.id || 'local-user';

    if (!isOnline) {
      const localId = Crypto.randomUUID();
      const localTx: LocalTransaction = {
        id: localId,
        serverId: null,
        userId: currentUserId,
        type: payload.type,
        amount: payload.amount,
        currency: 'INR',
        title: payload.title,
        categoryId: payload.categoryId,
        paymentMethod: payload.paymentMethod,
        paymentMethodId: null,
        date: payload.date,
        note: payload.note,
        syncStatus: 'PENDING_CREATE',
        clientMutationId: Crypto.randomUUID(),
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await sqliteService.saveLocalTransaction(localTx, true);
      setTransactions((prev) => [localTx as any, ...prev]);
      void syncEngine.refreshPendingCount(currentUserId);
      return localTx as any;
    }

    try {
      const res = await transactionService.createTransaction(payload);
      if (user?.id) {
        await sqliteService
          .saveLocalTransaction(
            {
              id: res.data.id,
              serverId: res.data.id,
              userId: user.id,
              type: res.data.type,
              amount: res.data.amount,
              currency: 'INR',
              title: res.data.title,
              categoryId: res.data.categoryId,
              paymentMethod: res.data.paymentMethod,
              paymentMethodId: null,
              date: res.data.date,
              note: res.data.note,
              syncStatus: 'SYNCED',
              clientMutationId: `server-${res.data.id}`,
              version: 1,
              createdAt: res.data.createdAt,
              updatedAt: res.data.updatedAt,
            },
            false
          )
          .catch(() => {});
      }
      await Promise.all([refreshTransactions(), refreshBudgets(), refreshDashboard(), refreshInsights()]);
      return res.data;
    } catch {
      const localId = Crypto.randomUUID();
      const localTx: LocalTransaction = {
        id: localId,
        serverId: null,
        userId: currentUserId,
        type: payload.type,
        amount: payload.amount,
        currency: 'INR',
        title: payload.title,
        categoryId: payload.categoryId,
        paymentMethod: payload.paymentMethod,
        paymentMethodId: null,
        date: payload.date,
        note: payload.note,
        syncStatus: 'PENDING_CREATE',
        clientMutationId: Crypto.randomUUID(),
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await sqliteService.saveLocalTransaction(localTx, true);
      setTransactions((prev) => [localTx as any, ...prev]);
      void syncEngine.refreshPendingCount(currentUserId);
      return localTx as any;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const isOnline = networkMonitor.getCachedOnline();
    if (!isOnline) {
      await sqliteService.deleteLocalTransaction(id, true);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (user?.id) {
        void syncEngine.refreshPendingCount(user.id);
      }
      return;
    }

    try {
      await transactionService.deleteTransaction(id);
      await sqliteService.deleteLocalTransaction(id, false).catch(() => {});
      await Promise.all([refreshTransactions(), refreshBudgets(), refreshDashboard(), refreshInsights()]);
    } catch {
      await sqliteService.deleteLocalTransaction(id, true);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (user?.id) {
        void syncEngine.refreshPendingCount(user.id);
      }
    }
  };

  const addBudget = async (
    payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spent'>
  ): Promise<Budget> => {
    const res = await budgetService.createBudget(payload);
    await refreshBudgets();
    return res.data;
  };

  const deleteBudget = async (id: string): Promise<void> => {
    await budgetApiClient.deleteBudget(id);
    await refreshBudgets();
  };

  return (
    <AppContext.Provider
      value={{
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
        showPreviewData,
        setShowPreviewData,
        resetToMockData,
        clearAllToEmptyState,
        userProfile,
        transactions,
        isTransactionsLoading,
        transactionsError,
        refreshTransactions,
        addTransaction,
        deleteTransaction,
        budgets,
        budgetSummary,
        isBudgetsLoading,
        budgetsError,
        refreshBudgets,
        addBudget,
        deleteBudget,
        dashboardSummary,
        isDashboardLoading,
        insights,
        isInsightsLoading,
        refreshDashboard,
        refreshInsights,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
