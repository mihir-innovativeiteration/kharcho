import { prisma } from '../config/db.js';

export const SYSTEM_CATEGORIES = [
  // Expense Categories
  { id: 'cat_food_dining', name: 'Food & Dining', type: 'EXPENSE' as const, icon: 'Utensils', color: '#F97316', isSystem: true },
  { id: 'cat_groceries', name: 'Groceries', type: 'EXPENSE' as const, icon: 'ShoppingBag', color: '#10B981', isSystem: true },
  { id: 'cat_transportation', name: 'Transportation', type: 'EXPENSE' as const, icon: 'Car', color: '#3B82F6', isSystem: true },
  { id: 'cat_petrol_fuel', name: 'Petrol & Fuel', type: 'EXPENSE' as const, icon: 'Fuel', color: '#EF4444', isSystem: true },
  { id: 'cat_shopping', name: 'Shopping', type: 'EXPENSE' as const, icon: 'ShoppingCart', color: '#EC4899', isSystem: true },
  { id: 'cat_bills_utilities', name: 'Bills & Utilities', type: 'EXPENSE' as const, icon: 'Zap', color: '#8B5CF6', isSystem: true },
  { id: 'cat_rent', name: 'Rent', type: 'EXPENSE' as const, icon: 'Home', color: '#6366F1', isSystem: true },
  { id: 'cat_health', name: 'Health', type: 'EXPENSE' as const, icon: 'HeartPulse', color: '#14B8A6', isSystem: true },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'EXPENSE' as const, icon: 'Film', color: '#F59E0B', isSystem: true },
  { id: 'cat_education', name: 'Education', type: 'EXPENSE' as const, icon: 'GraduationCap', color: '#06B6D4', isSystem: true },
  { id: 'cat_travel', name: 'Travel', type: 'EXPENSE' as const, icon: 'Plane', color: '#0EA5E9', isSystem: true },
  { id: 'cat_personal_care', name: 'Personal Care', type: 'EXPENSE' as const, icon: 'Sparkles', color: '#D946EF', isSystem: true },
  { id: 'cat_other_expense', name: 'Other Expense', type: 'EXPENSE' as const, icon: 'MoreHorizontal', color: '#64748B', isSystem: true },

  // Income Categories
  { id: 'cat_salary', name: 'Salary', type: 'INCOME' as const, icon: 'Briefcase', color: '#10B981', isSystem: true },
  { id: 'cat_freelance', name: 'Freelance', type: 'INCOME' as const, icon: 'Laptop', color: '#3B82F6', isSystem: true },
  { id: 'cat_business', name: 'Business', type: 'INCOME' as const, icon: 'Building2', color: '#6366F1', isSystem: true },
  { id: 'cat_investment_income', name: 'Investment Income', type: 'INCOME' as const, icon: 'TrendingUp', color: '#8B5CF6', isSystem: true },
  { id: 'cat_gift', name: 'Gift', type: 'INCOME' as const, icon: 'Gift', color: '#EC4899', isSystem: true },
  // Legacy & Alias mappings for existing UI
  { id: 'cat_food', name: 'Food & Dining', type: 'EXPENSE' as const, icon: 'Utensils', color: '#F97316', isSystem: true },
  { id: 'cat_transport', name: 'Transportation', type: 'EXPENSE' as const, icon: 'Car', color: '#3B82F6', isSystem: true },
  { id: 'cat_bills', name: 'Bills & Utilities', type: 'EXPENSE' as const, icon: 'Zap', color: '#8B5CF6', isSystem: true },
  { id: 'cat_housing', name: 'Rent & Housing', type: 'EXPENSE' as const, icon: 'Home', color: '#6366F1', isSystem: true },
  { id: 'cat_investment', name: 'Investments & SIP', type: 'EXPENSE' as const, icon: 'TrendingUp', color: '#14B8A6', isSystem: true },
  { id: 'cat_misc', name: 'Other Expenses', type: 'EXPENSE' as const, icon: 'MoreHorizontal', color: '#64748B', isSystem: true },
  { id: 'cat_invest_return', name: 'Dividends & Interest', type: 'INCOME' as const, icon: 'Coins', color: '#D97706', isSystem: true },
];

export const SYSTEM_PAYMENT_METHODS = [
  { id: 'pm_cash', name: 'Cash', type: 'CASH', details: 'Physical cash', isSystem: true },
  { id: 'pm_upi', name: 'UPI', type: 'UPI', details: 'Instant UPI transfer', isSystem: true },
  { id: 'pm_debit_card', name: 'Debit Card', type: 'CARD', details: 'Bank debit card', isSystem: true },
  { id: 'pm_credit_card', name: 'Credit Card', type: 'CARD', details: 'Credit line', isSystem: true },
  { id: 'pm_bank_transfer', name: 'Bank Transfer', type: 'BANK_TRANSFER', details: 'NEFT / RTGS / IMPS', isSystem: true },
];

/**
 * Idempotently seed default system categories and payment methods
 */
export async function seedDefaults(db: any = prisma): Promise<{ categoriesCount: number; paymentMethodsCount: number }> {
  let categoriesCount = 0;
  for (const cat of SYSTEM_CATEGORIES) {
    await db.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
      },
      create: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
      },
    });
    categoriesCount++;
  }

  let paymentMethodsCount = 0;
  for (const pm of SYSTEM_PAYMENT_METHODS) {
    await db.paymentMethod.upsert({
      where: { id: pm.id },
      update: {
        name: pm.name,
        type: pm.type,
        details: pm.details,
        isSystem: true,
      },
      create: {
        id: pm.id,
        name: pm.name,
        type: pm.type,
        details: pm.details,
        isSystem: true,
      },
    });
    paymentMethodsCount++;
  }

  return { categoriesCount, paymentMethodsCount };
}
