import { Budget, BudgetSummary } from './budget';
import { Transaction, TransactionFilters } from './transaction';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CategorySpendSummary {
  categoryId: string;
  categoryName: string;
  color: string;
  iconName: string;
  amount: number;
  percentage: number;
}

export interface DailyExpensePoint {
  date: string;
  amount: number;
}

export interface DashboardSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number; // Percentage: ((Income - Expense) / Income) * 100
  period: string; // e.g. "October 2026"
  incomeChangePercentage: number;
  expenseChangePercentage: number;
  categorySpending: CategorySpendSummary[];
  recentTransactions: Transaction[];
  monthlyExpenseTrend: DailyExpensePoint[];
}

export interface MonthlyComparisonPoint {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdownPoint {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  iconName: string;
}

export interface DayTrendPoint {
  day: string;
  amount: number;
}

export interface InsightHighlightPoint {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'tip';
  title: string;
  description: string;
  icon: string;
}

export interface InsightsData {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  monthlyComparison: MonthlyComparisonPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  dailyTrend: DayTrendPoint[];
  highlightInsights: InsightHighlightPoint[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  locale: string;
  monthlyIncomeTarget?: number;
  monthlySavingsTarget?: number;
  createdAt: string;
}

// Future Node.js REST API contract interfaces
export interface IAuthService {
  login(token: string): Promise<ApiResponse<UserProfile>>;
  logout(): Promise<ApiResponse<void>>;
  getProfile(): Promise<ApiResponse<UserProfile>>;
}

export interface ITransactionService {
  getTransactions(filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>>;
  getTransactionById(id: string): Promise<ApiResponse<Transaction>>;
  createTransaction(payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>>;
  updateTransaction(id: string, payload: Partial<Transaction>): Promise<ApiResponse<Transaction>>;
  deleteTransaction(id: string): Promise<ApiResponse<{ id: string }>>;
}

export interface IBudgetService {
  getBudgets(month?: string): Promise<ApiResponse<Budget[]>>;
  getBudgetSummary(month?: string): Promise<ApiResponse<BudgetSummary>>;
  createBudget(payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spent'>): Promise<ApiResponse<Budget>>;
  updateBudget(id: string, payload: Partial<Budget>): Promise<ApiResponse<Budget>>;
}

export interface IDashboardService {
  getDashboardSummary(month?: string): Promise<ApiResponse<DashboardSummary>>;
  getInsights(period?: string): Promise<ApiResponse<InsightsData>>;
}
