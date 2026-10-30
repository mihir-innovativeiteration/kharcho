export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  iconName: string;
  color: string;
  lightBg: string;
  isCustom?: boolean;
}
