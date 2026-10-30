import { z } from 'zod';
import { validateAndParseAmount } from '../utils/money.js';

export const createTransactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE'], {
      errorMap: () => ({ message: 'Transaction type must be either INCOME or EXPENSE' }),
    }),
    amount: z.union([z.string(), z.number()]).refine(
      (val) => validateAndParseAmount(val).valid,
      (val) => ({ message: validateAndParseAmount(val).error || 'Invalid monetary amount' })
    ),
    currency: z.string().trim().length(3).default('INR'),
    description: z.string().trim().min(1, 'Description is required').max(255, 'Description cannot exceed 255 characters'),
    categoryId: z.string().trim().min(1, 'Category ID is required'),
    paymentMethodId: z.string().trim().nullable().optional(),
    transactionDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'transactionDate must be a valid ISO-8601 date string' }
    ),
    notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
  })
  .strict();

export const updateTransactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z
      .union([z.string(), z.number()])
      .refine(
        (val) => validateAndParseAmount(val).valid,
        (val) => ({ message: validateAndParseAmount(val).error || 'Invalid monetary amount' })
      )
      .optional(),
    currency: z.string().trim().length(3).optional(),
    description: z.string().trim().min(1).max(255).optional(),
    categoryId: z.string().trim().min(1).optional(),
    paymentMethodId: z.string().trim().nullable().optional(),
    transactionDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'transactionDate must be a valid ISO-8601 date string',
      })
      .optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().trim().optional(),
  paymentMethodId: z.string().trim().optional(),
  startDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid date',
  }),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid date',
  }),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['transactionDate', 'createdAt', 'amount']).default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQueryParams = z.infer<typeof transactionQuerySchema>;
