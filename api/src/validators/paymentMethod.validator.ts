import { z } from 'zod';

export const createPaymentMethodSchema = z
  .object({
    name: z.string().trim().min(1, 'Payment method name is required').max(100),
    type: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'], {
      errorMap: () => ({ message: 'Payment method type must be CASH, UPI, CARD, BANK_TRANSFER, or OTHER' }),
    }),
    details: z.string().trim().max(100).optional(),
  })
  .strict();

export const updatePaymentMethodSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']).optional(),
    details: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
