import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    name: z.string().trim().min(1, 'Budget name is required').max(100, 'Budget name cannot exceed 100 characters'),
    type: z.enum(['OVERALL', 'CATEGORY']).default('CATEGORY'),
    categoryId: z.string().trim().optional().nullable(),
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive decimal with up to 2 decimal places'),
    currency: z.string().trim().length(3).default('INR'),
    period: z.enum(['MONTHLY', 'CUSTOM']).default('MONTHLY'),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    warningThresholds: z
      .union([
        z.array(z.number().int().min(1).max(200)),
        z.string().regex(/^(\d+)(,\d+)*$/, 'Warning thresholds must be comma-separated integers'),
      ])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'CATEGORY' && !data.categoryId) {
        return false;
      }
      return true;
    },
    {
      message: 'Category is required for category-specific budgets',
      path: ['categoryId'],
    }
  )
  .refine(
    (data) => {
      if (data.period === 'CUSTOM') {
        if (!data.startDate || !data.endDate) return false;
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date for custom budget periods',
      path: ['endDate'],
    }
  );

export const updateBudgetSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive decimal with up to 2 decimal places')
      .optional(),
    currency: z.string().trim().length(3).optional(),
    categoryId: z.string().trim().optional().nullable(),
    warningThresholds: z
      .union([
        z.array(z.number().int().min(1).max(200)),
        z.string().regex(/^(\d+)(,\d+)*$/),
      ])
      .optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export const budgetQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
  type: z.enum(['OVERALL', 'CATEGORY']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  currency: z.string().trim().length(3).default('INR'),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryParams = z.infer<typeof budgetQuerySchema>;
