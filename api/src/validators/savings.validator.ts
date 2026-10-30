import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(100, 'Goal name cannot exceed 100 characters'),
  description: z.string().trim().max(255).optional().nullable(),
  targetAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Target amount must be a valid positive decimal with up to 2 decimal places'),
  currency: z.string().trim().length(3).default('INR'),
  targetDate: z.string().datetime().optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
});

export const updateSavingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  targetAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Target amount must be a valid positive decimal with up to 2 decimal places')
    .optional(),
  currency: z.string().trim().length(3).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

export const createContributionSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Contribution amount must be a valid positive decimal with up to 2 decimal places'),
  contributionDate: z.string().datetime().optional(),
  note: z.string().trim().max(255).optional().nullable(),
});

export const savingsGoalQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  currency: z.string().trim().length(3).default('INR'),
});

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type SavingsGoalQueryParams = z.infer<typeof savingsGoalQuerySchema>;
