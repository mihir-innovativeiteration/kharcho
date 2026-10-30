import { z } from 'zod';

export const syncOperationSchema = z.object({
  operationId: z.string().min(1, 'operationId is required'),
  entityType: z.literal('TRANSACTION'),
  entityId: z.string().min(1, 'entityId is required'),
  operationType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  clientMutationId: z.string().optional(),
  expectedVersion: z.number().int().min(1).optional(),
  payload: z
    .object({
      type: z.enum(['INCOME', 'EXPENSE']).optional(),
      amount: z.union([z.number(), z.string()]).optional(),
      currency: z.string().default('INR').optional(),
      description: z.string().min(1).max(255).optional(),
      categoryId: z.string().min(1).optional(),
      paymentMethodId: z.string().nullable().optional(),
      transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid transaction date ISO string',
      }).optional(),
      notes: z.string().max(1000).nullable().optional(),
    })
    .optional(),
});

export const batchSyncInputSchema = z.object({
  operations: z
    .array(syncOperationSchema)
    .min(1, 'At least one operation is required')
    .max(50, 'Max 50 operations allowed per batch'),
});

export const syncChangesQuerySchema = z.object({
  since: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid since date ISO string',
    }),
});

export type SyncOperationInput = z.infer<typeof syncOperationSchema>;
export type BatchSyncInput = z.infer<typeof batchSyncInputSchema>;
export type SyncChangesQuery = z.infer<typeof syncChangesQuerySchema>;
