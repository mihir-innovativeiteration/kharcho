import { Category } from '@/types/category';

export const EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'cat_food',
    name: 'Food & Dining',
    type: 'expense',
    iconName: 'Utensils',
    color: '#F97316', // Orange
    lightBg: '#FFF7ED',
  },
  {
    id: 'cat_groceries',
    name: 'Groceries',
    type: 'expense',
    iconName: 'ShoppingBag',
    color: '#10B981', // Emerald
    lightBg: '#ECFDF5',
  },
  {
    id: 'cat_transport',
    name: 'Transportation',
    type: 'expense',
    iconName: 'Car',
    color: '#0EA5E9', // Sky
    lightBg: '#F0F9FF',
  },
  {
    id: 'cat_bills',
    name: 'Bills & Utilities',
    type: 'expense',
    iconName: 'Zap',
    color: '#F59E0B', // Amber
    lightBg: '#FFFBEB',
  },
  {
    id: 'cat_shopping',
    name: 'Shopping',
    type: 'expense',
    iconName: 'Shirt',
    color: '#EC4899', // Pink
    lightBg: '#FDF2F8',
  },
  {
    id: 'cat_health',
    name: 'Health & Medical',
    type: 'expense',
    iconName: 'HeartPulse',
    color: '#EF4444', // Red
    lightBg: '#FEF2F2',
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment',
    type: 'expense',
    iconName: 'Film',
    color: '#8B5CF6', // Purple
    lightBg: '#F5F3FF',
  },
  {
    id: 'cat_housing',
    name: 'Rent & Housing',
    type: 'expense',
    iconName: 'Home',
    color: '#6366F1', // Indigo
    lightBg: '#EEF2FF',
  },
  {
    id: 'cat_investment',
    name: 'Investments & SIP',
    type: 'expense',
    iconName: 'TrendingUp',
    color: '#14B8A6', // Teal
    lightBg: '#F0FDFA',
  },
  {
    id: 'cat_misc',
    name: 'Other Expenses',
    type: 'expense',
    iconName: 'MoreHorizontal',
    color: '#64748B', // Slate
    lightBg: '#F8FAFC',
  },
];

export const INCOME_CATEGORIES: Category[] = [
  {
    id: 'cat_salary',
    name: 'Monthly Salary',
    type: 'income',
    iconName: 'Briefcase',
    color: '#059669', // Emerald
    lightBg: '#ECFDF5',
  },
  {
    id: 'cat_freelance',
    name: 'Freelance & Consulting',
    type: 'income',
    iconName: 'Laptop',
    color: '#0284C7', // Sky
    lightBg: '#F0F9FF',
  },
  {
    id: 'cat_invest_return',
    name: 'Dividends & Interest',
    type: 'income',
    iconName: 'Coins',
    color: '#D97706', // Amber
    lightBg: '#FFFBEB',
  },
  {
    id: 'cat_gift',
    name: 'Gifts & Cashback',
    type: 'income',
    iconName: 'Gift',
    color: '#9333EA', // Purple
    lightBg: '#FAF5FF',
  },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryById(id: string): Category {
  const found = ALL_CATEGORIES.find((c) => c.id === id);
  if (found) return found;
  return {
    id,
    name: 'General',
    type: 'expense',
    iconName: 'CircleDollarSign',
    color: '#64748B',
    lightBg: '#F8FAFC',
  };
}
