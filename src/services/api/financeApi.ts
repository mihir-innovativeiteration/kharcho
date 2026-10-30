import { authApi } from './authApi';
import {
  ApiResponse,
  DashboardSummary,
  InsightsData,
  IDashboardService,
  CategoryBreakdownPoint,
  DayTrendPoint,
  InsightHighlightPoint,
  MonthlyComparisonPoint,
} from '@/types/api';
import { localService } from '../mock';
import { storage } from '../storage';
import { APP_CONFIG } from '@/constants/config';

export interface FinancePeriod {
  startDate: string;
  endDate: string;
}

export interface BackendFinanceSummary {
  totalIncome: string;
  totalExpenses: string;
  netActivity: string;
  transactionCount: number;
  period: FinancePeriod;
  currency: string;
  previousPeriod?: {
    startDate: string;
    endDate: string;
    totalIncome: string;
    totalExpenses: string;
    netActivity: string;
  };
  changes?: {
    incomePercentage: number;
    expensePercentage: number;
  };
  note?: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color?: string | null;
  total: string;
  percentage: string;
  count: number;
}

export interface BackendCategoryBreakdown {
  period: FinancePeriod;
  currency: string;
  expenses: {
    total: string;
    breakdown: CategoryBreakdownItem[];
  };
  income: {
    total: string;
    breakdown: CategoryBreakdownItem[];
  };
}

export interface TrendTimelinePoint {
  date: string;
  label: string;
  income: string;
  expense: string;
  net: string;
}

export interface BackendTrendsResponse {
  period: FinancePeriod;
  currency: string;
  groupBy: 'day' | 'month';
  timeline: TrendTimelinePoint[];
}

export class FinanceApiClient {
  async getSummary(params?: { startDate?: string; endDate?: string; currency?: string }): Promise<BackendFinanceSummary> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.currency) query.append('currency', params.currency);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await authApi.request<any>(
      `/finance/summary${queryString}`
    );
    return res?.data !== undefined ? res.data : res;
  }

  async getCategoryBreakdown(params?: { startDate?: string; endDate?: string; currency?: string }): Promise<BackendCategoryBreakdown> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.currency) query.append('currency', params.currency);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await authApi.request<any>(
      `/finance/category-breakdown${queryString}`
    );
    return res?.data !== undefined ? res.data : res;
  }

  async getTrends(params?: { startDate?: string; endDate?: string; currency?: string; groupBy?: 'day' | 'month' }): Promise<BackendTrendsResponse> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.currency) query.append('currency', params.currency);
    if (params?.groupBy) query.append('groupBy', params.groupBy);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await authApi.request<any>(
      `/finance/trends${queryString}`
    );
    return res?.data !== undefined ? res.data : res;
  }
}

export const financeApi = new FinanceApiClient();

export function getDateRangeForInsightsPeriod(period?: string): {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'month';
  periodLabel: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === 'last_3_months') {
    const start = new Date(year, month - 2, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      groupBy: 'month',
      periodLabel: 'Last 3 Months',
    };
  }

  if (period === 'year_to_date') {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      groupBy: 'month',
      periodLabel: `Year ${year}`,
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

export class LiveDashboardService implements IDashboardService {
  async getDashboardSummary(month?: string): Promise<ApiResponse<DashboardSummary>> {
    if (!authApi.getAccessToken()) {
      return {
        success: true,
        data: {
          currentBalance: 0,
          totalIncome: 0,
          totalExpense: 0,
          savingsRate: 0,
          period: 'This Month',
          incomeChangePercentage: 0,
          expenseChangePercentage: 0,
          categorySpending: [],
          recentTransactions: [],
          monthlyExpenseTrend: [],
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const [summaryData, breakdownData] = await Promise.all([
        financeApi.getSummary(),
        financeApi.getCategoryBreakdown(),
      ]);

      const incomeNum = parseFloat(summaryData?.totalIncome || '0') || 0;
      const expenseNum = parseFloat(summaryData?.totalExpenses || '0') || 0;
      const netActivityNum = parseFloat(summaryData?.netActivity || '0') || 0;
      const savingsRate = incomeNum > 0 ? ((incomeNum - expenseNum) / incomeNum) * 100 : 0;

      const categorySpending = (breakdownData?.expenses?.breakdown || []).map((cat: any) => ({
        categoryId: cat.categoryId,
        categoryName: cat.name,
        color: cat.color || '#10B981',
        iconName: cat.icon || 'Utensils',
        amount: parseFloat(cat.total) || 0,
        percentage: parseFloat(cat.percentage) || 0,
      }));

      return {
        success: true,
        data: {
          currentBalance: netActivityNum,
          totalIncome: incomeNum,
          totalExpense: expenseNum,
          savingsRate: Math.max(0, Math.round(savingsRate)),
          period: 'This Month',
          incomeChangePercentage: summaryData?.changes?.incomePercentage || 0,
          expenseChangePercentage: summaryData?.changes?.expensePercentage || 0,
          categorySpending,
          recentTransactions: [],
          monthlyExpenseTrend: [],
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: true,
        data: {
          currentBalance: 0,
          totalIncome: 0,
          totalExpense: 0,
          savingsRate: 0,
          period: 'This Month',
          incomeChangePercentage: 0,
          expenseChangePercentage: 0,
          categorySpending: [],
          recentTransactions: [],
          monthlyExpenseTrend: [],
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getInsights(period?: string): Promise<ApiResponse<InsightsData>> {
    const token = authApi.getAccessToken();

    // Authenticated users ALWAYS see real live data from database!
    if (!token) {
      const previewFlag = await storage.getItem(APP_CONFIG.storageKeys.showPreviewData);
      if (previewFlag === 'true') {
        return localService.getInsights(period);
      }

      return {
        success: true,
        data: {
          period: 'This Month',
          totalIncome: 0,
          totalExpense: 0,
          netSavings: 0,
          savingsRate: 0,
          monthlyComparison: [],
          categoryBreakdown: [],
          dailyTrend: [],
          highlightInsights: [],
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const range = getDateRangeForInsightsPeriod(period);
      const now = new Date();
      const multiMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0, 0).toISOString();
      const multiMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const [summaryData, breakdownData, trendsData, multiMonthTrends] = await Promise.all([
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
        financeApi.getTrends({
          startDate: multiMonthStart,
          endDate: multiMonthEnd,
          groupBy: 'month',
        }),
      ]);

      const incomeNum = parseFloat(summaryData?.totalIncome || '0') || 0;
      const expenseNum = parseFloat(summaryData?.totalExpenses || '0') || 0;
      const netSavings = incomeNum - expenseNum;
      const rawSavingsRate = incomeNum > 0 ? (netSavings / incomeNum) * 100 : 0;
      const savingsRate = Math.max(0, Math.round(rawSavingsRate));

      const categoryBreakdown: CategoryBreakdownPoint[] = (breakdownData?.expenses?.breakdown || []).map((cat: any) => ({
        categoryId: cat.categoryId,
        name: cat.name,
        amount: parseFloat(cat.total) || 0,
        percentage: Math.round(parseFloat(cat.percentage) || 0),
        color: cat.color || '#F97316',
        iconName: cat.icon || 'Utensils',
      }));

      // Monthly comparison points
      const comparisonPoints: MonthlyComparisonPoint[] = (multiMonthTrends?.timeline || []).map((pt: any) => {
        const monthLabel = pt.label.replace(new RegExp(` ${now.getFullYear()}`), '').trim();
        return {
          month: monthLabel,
          income: parseFloat(pt.income) || 0,
          expense: parseFloat(pt.expense) || 0,
        };
      });

      if (comparisonPoints.length === 0) {
        comparisonPoints.push({
          month: range.periodLabel.split(' ')[0],
          income: incomeNum,
          expense: expenseNum,
        });
      }

      const dailyTrend: DayTrendPoint[] = (trendsData?.timeline || []).map((pt: any) => ({
        day: pt.label,
        amount: parseFloat(pt.expense) || 0,
      }));

      // Data-driven highlights
      const highlightInsights: InsightHighlightPoint[] = [];

      if (savingsRate >= 30) {
        highlightInsights.push({
          id: 'insight-savings-rate',
          type: 'positive',
          title: 'Strong Savings Rate',
          description: `Your savings rate is ${savingsRate}%, exceeding the benchmark 30% financial safety threshold.`,
          icon: 'PiggyBank',
        });
      } else if (incomeNum > 0 && savingsRate < 20) {
        highlightInsights.push({
          id: 'insight-savings-low',
          type: 'warning',
          title: 'Savings Alert',
          description: `Your current savings rate is ${savingsRate}%. Consider reviewing high discretionary expenses to build your reserve.`,
          icon: 'AlertTriangle',
        });
      }

      if (categoryBreakdown.length > 0) {
        const topCat = categoryBreakdown[0];
        highlightInsights.push({
          id: 'insight-top-expense',
          type: topCat.percentage > 40 ? 'warning' : 'neutral',
          title: `Highest Expense: ${topCat.name}`,
          description: `${topCat.name} accounts for ${topCat.percentage}% (₹${Math.round(topCat.amount).toLocaleString('en-IN')}) of total outflow this period.`,
          icon: topCat.iconName === 'Utensils' ? 'Utensils' : 'Sparkles',
        });
      }

      if (netSavings > 0) {
        highlightInsights.push({
          id: 'insight-cashflow',
          type: 'positive',
          title: 'Positive Cashflow',
          description: `You have retained ₹${Math.round(netSavings).toLocaleString('en-IN')} in net surplus this period.`,
          icon: 'Sparkles',
        });
      } else if (expenseNum > 0 && netSavings < 0) {
        highlightInsights.push({
          id: 'insight-cashflow-neg',
          type: 'warning',
          title: 'Negative Cashflow',
          description: `Outflow exceeds recorded income by ₹${Math.abs(Math.round(netSavings)).toLocaleString('en-IN')} for this period.`,
          icon: 'AlertTriangle',
        });
      }

      return {
        success: true,
        data: {
          period: range.periodLabel,
          totalIncome: incomeNum,
          totalExpense: expenseNum,
          netSavings,
          savingsRate,
          monthlyComparison: comparisonPoints,
          categoryBreakdown,
          dailyTrend,
          highlightInsights,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('LiveDashboardService getInsights error:', e);
      return {
        success: true,
        data: {
          period: 'This Month',
          totalIncome: 0,
          totalExpense: 0,
          netSavings: 0,
          savingsRate: 0,
          monthlyComparison: [],
          categoryBreakdown: [],
          dailyTrend: [],
          highlightInsights: [],
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const liveDashboardService = new LiveDashboardService();
