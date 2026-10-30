import { z } from 'zod';

export const createRecurringRuleSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().trim().max(255).optional().nullable(),
    providerName: z.string().trim().max(100).optional().nullable(),
    type: z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive decimal with up to 2 decimal places'),
    currency: z.string().trim().length(3).default('INR'),
    categoryId: z.string().trim().optional().nullable(),
    paymentMethodId: z.string().trim().optional().nullable(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
    interval: z.number().int().min(1, 'Interval must be at least 1').default(1),
    startDate: z.string().datetime({ message: 'Valid start date required (ISO 8601)' }),
    endDate: z.string().datetime().optional().nullable(),
    timezone: z.string().default('Asia/Kolkata'),
    reminderEnabled: z.boolean().default(true),
    reminderDaysBefore: z.number().int().min(0).max(30).default(1),
    autoPost: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const updateRecurringRuleSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(255).optional().nullable(),
    providerName: z.string().trim().max(100).optional().nullable(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/)
      .optional(),
    currency: z.string().trim().length(3).optional(),
    categoryId: z.string().trim().optional().nullable(),
    paymentMethodId: z.string().trim().optional().nullable(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    interval: z.number().int().min(1).optional(),
    endDate: z.string().datetime().optional().nullable(),
    reminderEnabled: z.boolean().optional(),
    reminderDaysBefore: z.number().int().min(0).max(30).optional(),
    autoPost: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED']).optional(),
  });

export const queryRecurringRulesSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED']).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const queryOccurrencesSchema = z.object({
  ruleId: z.string().optional(),
  recurringRuleId: z.string().optional(),
  status: z.enum(['UPCOMING', 'DUE', 'AWAITING_CONFIRMATION', 'PAID', 'SKIPPED', 'FAILED']).optional(),
  startDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid date',
  }),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid date',
  }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const confirmPaidSchema = z.object({
  paymentMethodId: z.string().trim().optional().nullable(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateRecurringRuleInput = z.infer<typeof createRecurringRuleSchema>;
export type UpdateRecurringRuleInput = z.infer<typeof updateRecurringRuleSchema>;
export type QueryRecurringRulesParams = z.infer<typeof queryRecurringRulesSchema>;
export type QueryOccurrencesParams = z.infer<typeof queryOccurrencesSchema>;
export type ConfirmPaidInput = z.infer<typeof confirmPaidSchema>;
