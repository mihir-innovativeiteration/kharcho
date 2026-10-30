import { useCallback, useEffect, useRef, useState } from 'react';
import { authApi } from '@/services/api/authApi';
import {
  BackendCategoryBreakdown,
  BackendFinanceSummary,
  BackendTrendsResponse,
  financeApi,
} from '@/services/api/financeApi';
import { liveTransactionService } from '@/services/api/transactionApi';
import { Transaction } from '@/types/transaction';
import { useApp } from './useApp';

export type DashboardPeriod = 'this_month' | 'last_month' | 'last_6_months' | 'custom';

export interface DashboardDateRange {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'month';
  periodLabel: string;
}

export function getDateRangeForPeriod(period: DashboardPeriod, customStart?: string, customEnd?: string): DashboardDateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === 'last_month') {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      groupBy: 'day',
      periodLabel: start.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  }

  if (period === 'last_6_months') {
    const start = new Date(year, month - 5, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      groupBy: 'month',
      periodLabel: 'Last 6 Months',
    };
  }

  if (period === 'custom' && customStart && customEnd) {
    return {
      startDate: new Date(customStart).toISOString(),
      endDate: new Date(customEnd).toISOString(),
      groupBy: (new Date(customEnd).getTime() - new Date(customStart).getTime()) > 45 * 24 * 60 * 60 * 1000 ? 'month' : 'day',
      periodLabel: 'Custom Period',
    };
  }

  // Default: 'this_month'
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    groupBy: 'day',
    periodLabel: start.toLocaleString('default', { month: 'long', year: 'numeric' }),
  };
}

export function useDashboardData() {
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('this_month');
  const [summary, setSummary] = useState<BackendFinanceSummary | null>(null);
  const [breakdown, setBreakdown] = useState<BackendCategoryBreakdown | null>(null);
  const [trends, setTrends] = useState<BackendTrendsResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // AppContext provides transactions mutation updates
  const { transactions: globalTransactions, showPreviewData } = useApp();

  // Track request sequence to prevent stale responses from overwriting current data
  const requestSeqRef = useRef<number>(0);

  const fetchDashboardData = useCallback(
    async (period: DashboardPeriod, isPullToRefresh = false) => {
      const currentSeq = ++requestSeqRef.current;
      if (isPullToRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const range = getDateRangeForPeriod(period);

      try {
        const isAuth = Boolean(authApi.getAccessToken());

        if (isAuth) {
          // Live API calls
          const [summaryData, breakdownData, trendsData, recentTxData] = await Promise.all([
            financeApi.getSummary({
              startDate: range.startDate,
              endDate: range.endDate,
            }),
            financeApi.getCategoryBreakdown({
              startDate: range.startDate,
              endDate: range.endDate,
            }),
            financeApi.getTrends({
              startDate: range.startDate,
              endDate: range.endDate,
              groupBy: range.groupBy,
            }),
            liveTransactionService.getTransactions({ limit: 5 } as any),
          ]);

          // Prevent stale response overwrite
          if (currentSeq !== requestSeqRef.current) return;

          setSummary(summaryData);
          setBreakdown(breakdownData);
          setTrends(trendsData);
          setRecentTransactions((recentTxData.data || []).slice(0, 5));
        } else {
          // Fallback when demo preview data mode is on
          const [summaryData, breakdownData, trendsData] = await Promise.all([
            financeApi.getSummary({
              startDate: range.startDate,
              endDate: range.endDate,
            }),
            financeApi.getCategoryBreakdown({
              startDate: range.startDate,
              endDate: range.endDate,
            }),
            financeApi.getTrends({
              startDate: range.startDate,
              endDate: range.endDate,
              groupBy: range.groupBy,
            }),
          ]);

          if (currentSeq !== requestSeqRef.current) return;

          setSummary(summaryData);
          setBreakdown(breakdownData);
          setTrends(trendsData);
          setRecentTransactions(globalTransactions.slice(0, 5));
        }
      } catch (err: any) {
        if (currentSeq === requestSeqRef.current) {
          console.warn('Dashboard fetch error:', err);
          setError(err?.message || 'Unable to fetch dashboard financial data. Please try again.');
        }
      } finally {
        if (currentSeq === requestSeqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [globalTransactions]
  );

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(() => {
      if (!isCancelled) {
        void fetchDashboardData(selectedPeriod);
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedPeriod, fetchDashboardData, globalTransactions.length, showPreviewData]);

  const onPeriodChange = (newPeriod: DashboardPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  const refetch = useCallback(async () => {
    await fetchDashboardData(selectedPeriod, true);
  }, [fetchDashboardData, selectedPeriod]);

  const hasData = Boolean(
    (summary &&
      (parseFloat(summary.totalIncome) > 0 ||
        parseFloat(summary.totalExpenses) > 0)) ||
      recentTransactions.length > 0 ||
      globalTransactions.length > 0
  );

  return {
    selectedPeriod,
    dateRange: getDateRangeForPeriod(selectedPeriod),
    summary,
    breakdown,
    trends,
    recentTransactions,
    isLoading,
    isRefreshing,
    error,
    hasData,
    onPeriodChange,
    refetch,
  };
}
