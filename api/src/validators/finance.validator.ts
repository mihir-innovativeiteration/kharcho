import { z } from 'zod';

export const financeQuerySchema = z.object({
  startDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid ISO date',
  }),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid ISO date',
  }),
  currency: z.string().trim().length(3).default('INR'),
  groupBy: z.enum(['day', 'month']).optional(),
});

export type FinanceQueryParams = z.infer<typeof financeQuerySchema>;
