import { z } from 'zod';
import { validateAndParseAmount } from '../utils/money.js';

export const parseTransactionInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2, 'Input text must be at least 2 characters')
    .max(500, 'Input text cannot exceed 500 characters'),
  locale: z.string().trim().optional().default('en'),
  timezone: z.string().trim().optional().default('Asia/Kolkata'),
});

export const draftItemSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .string()
    .trim()
    .refine(
      (val) => validateAndParseAmount(val).valid,
      (val) => ({ message: validateAndParseAmount(val).error || 'Invalid monetary amount' })
    ),
  currency: z.string().trim().length(3).default('INR'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  categoryId: z.string().trim().min(1, 'Category is required'),
  paymentMethodId: z.string().trim().nullable().optional(),
  transactionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'transactionDate must be a valid ISO-8601 date string',
    }),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const confirmDraftsInputSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .min(8, 'idempotencyKey must be at least 8 characters')
    .max(100),
  drafts: z
    .array(draftItemSchema)
    .min(1, 'At least one transaction draft must be provided')
    .max(20, 'Cannot confirm more than 20 drafts at once'),
});

export type ParseTransactionInput = z.infer<typeof parseTransactionInputSchema>;
export type DraftItemInput = z.infer<typeof draftItemSchema>;
export type ConfirmDraftsInput = z.infer<typeof confirmDraftsInputSchema>;
