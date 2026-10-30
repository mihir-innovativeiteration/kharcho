import { Category } from './category';

export type BudgetType = 'OVERALL' | 'CATEGORY';
export type BudgetPeriod = 'MONTHLY' | 'CUSTOM';
export type ThresholdStatus = 'NORMAL' | 'WARNING_50' | 'WARNING_80' | 'EXCEEDED';

export interface Budget {
  id: string;
  userId?: string;
  name?: string;
  type?: BudgetType;
  categoryId: string;
  category?: Category;
  amount: number; // Monthly budget limit in INR
  spent: number;  // Current spent amount in INR
  remaining?: number;
  month: string;  // e.g. "2026-10"
  period?: BudgetPeriod;
  periodKey?: string;
  startDate?: string;
  endDate?: string;
  utilizationPercentage?: number;
  isExceeded?: boolean;
  thresholdStatus?: ThresholdStatus;
  warningThresholds?: number[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  periodKey?: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  activeBudgetsCount?: number;
  hasOverallBudget?: boolean;
}

export type SavingsGoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface SavingsGoal {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  targetAmount: number;
  totalSaved: number;
  remainingAmount: number;
  completionPercentage: number;
  currency: string;
  targetDate?: string | null;
  icon?: string;
  color?: string;
  status: SavingsGoalStatus;
  isCompleted: boolean;
  contributionsCount?: number;
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  userId?: string;
  goalId: string;
  amount: number;
  contributionDate: string;
  note?: string | null;
  disclaimer: string;
  createdAt: string;
}

export interface BudgetAlert {
  id: string;
  userId?: string;
  budgetId: string;
  budgetName: string;
  budgetType: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color?: string;
  } | null;
  thresholdPercent: number;
  periodKey: string;
  triggeredAt: string;
  readAt?: string | null;
  isRead: boolean;
  createdAt: string;
}
