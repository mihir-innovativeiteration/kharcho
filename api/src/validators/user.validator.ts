import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(70).optional(),
  preferredLanguage: z.enum(['en', 'gu', 'hi']).optional(),
  preferredTheme: z.enum(['light', 'dark']).optional(),
  budgetAlertsEnabled: z.boolean().optional(),
});
