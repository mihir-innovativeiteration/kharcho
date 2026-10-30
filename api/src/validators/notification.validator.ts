import { z } from 'zod';

export const registerPushTokenSchema = z.object({
  token: z
    .string()
    .min(10, 'Push token must be at least 10 characters long')
    .max(255, 'Push token too long'),
  platform: z.enum(['ios', 'android', 'web']),
});

export const unregisterPushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
});

export const updateNotificationPreferencesSchema = z.object({
  budgetAlertsEnabled: z.boolean().optional(),
  billRemindersEnabled: z.boolean().optional(),
  savingsMilestonesEnabled: z.boolean().optional(),
  syncAlertsEnabled: z.boolean().optional(),
  dailySummaryEnabled: z.boolean().optional(),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
