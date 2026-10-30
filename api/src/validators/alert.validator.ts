import { z } from 'zod';

export const queryAlertsSchema = z.object({
  isRead: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'Page must be >= 1'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

export type QueryAlertsParams = z.infer<typeof queryAlertsSchema>;
