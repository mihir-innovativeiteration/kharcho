import { Category, TransactionType } from './category';

export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Net Banking';

export interface Transaction {
  id: string;
  title: string;
  amount: number; // Stored in Rupees (INR)
  type: TransactionType;
  categoryId: string;
  category?: Category;
  date: string; // ISO 8601 string (e.g. 2026-10-27T10:30:00Z)
  note?: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  tags?: string[];
  syncStatus?: 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE' | 'CONFLICT';
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  searchQuery?: string;
  type?: 'all' | 'expense' | 'income';
  categoryId?: string;
  period?: 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface TransactionGroup {
  dateTitle: string; // e.g. "Today, 27 Oct", "Yesterday", "24 Oct 2026"
  formattedDate: string;
  totalExpense: number;
  totalIncome: number;
  transactions: Transaction[];
}
