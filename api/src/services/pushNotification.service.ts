import { prisma } from '../config/db.js';
import {
  RegisterPushTokenInput,
  UpdateNotificationPreferencesInput,
} from '../validators/notification.validator.js';

export interface PushMessagePayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
  category?: 'bill' | 'budget' | 'savings' | 'sync' | 'general';
}

export class PushNotificationService {
  /**
   * Register or update Expo push token for authenticated user
   */
  static async registerDeviceToken(
    userId: string,
    input: RegisterPushTokenInput,
    db: any = prisma
  ) {
    const record = await db.devicePushToken.upsert({
      where: { token: input.token },
      create: {
        userId,
        token: input.token,
        platform: input.platform,
        isActive: true,
      },
      update: {
        userId,
        platform: input.platform,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    return {
      success: true,
      token: record.token,
      platform: record.platform,
      isActive: record.isActive,
    };
  }

  /**
   * Deactivate or remove device push token on logout
   */
  static async unregisterDeviceToken(
    userId: string,
    token: string,
    db: any = prisma
  ) {
    await db.devicePushToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return { success: true };
  }

  /**
   * Get user notification preferences
   */
  static async getPreferences(userId: string, db: any = prisma) {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      budgetAlertsEnabled: user.budgetAlertsEnabled ?? true,
      billRemindersEnabled: user.billRemindersEnabled ?? true,
      savingsMilestonesEnabled: user.savingsMilestonesEnabled ?? true,
      syncAlertsEnabled: user.syncAlertsEnabled ?? true,
      dailySummaryEnabled: user.dailySummaryEnabled ?? false,
    };
  }

  /**
   * Update user notification preferences
   */
  static async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferencesInput,
    db: any = prisma
  ) {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(input.budgetAlertsEnabled !== undefined ? { budgetAlertsEnabled: input.budgetAlertsEnabled } : {}),
        ...(input.billRemindersEnabled !== undefined ? { billRemindersEnabled: input.billRemindersEnabled } : {}),
        ...(input.savingsMilestonesEnabled !== undefined ? { savingsMilestonesEnabled: input.savingsMilestonesEnabled } : {}),
        ...(input.syncAlertsEnabled !== undefined ? { syncAlertsEnabled: input.syncAlertsEnabled } : {}),
        ...(input.dailySummaryEnabled !== undefined ? { dailySummaryEnabled: input.dailySummaryEnabled } : {}),
      },
    });

    return {
      budgetAlertsEnabled: updated.budgetAlertsEnabled,
      billRemindersEnabled: updated.billRemindersEnabled,
      savingsMilestonesEnabled: updated.savingsMilestonesEnabled,
      syncAlertsEnabled: updated.syncAlertsEnabled,
      dailySummaryEnabled: updated.dailySummaryEnabled,
    };
  }

  /**
   * Dispatch push notification to a user's active devices
   */
  static async sendPushNotification(
    userId: string,
    message: PushMessagePayload,
    db: any = prisma
  ) {
    // 1. Verify user preference for category
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { sent: 0, reason: 'USER_NOT_FOUND' };

    if (message.category === 'budget' && !user.budgetAlertsEnabled) {
      return { sent: 0, reason: 'PREFERENCE_DISABLED' };
    }
    if (message.category === 'bill' && !user.billRemindersEnabled) {
      return { sent: 0, reason: 'PREFERENCE_DISABLED' };
    }
    if (message.category === 'savings' && !user.savingsMilestonesEnabled) {
      return { sent: 0, reason: 'PREFERENCE_DISABLED' };
    }
    if (message.category === 'sync' && !user.syncAlertsEnabled) {
      return { sent: 0, reason: 'PREFERENCE_DISABLED' };
    }

    // 2. Fetch active tokens
    const tokens = await db.devicePushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!tokens || tokens.length === 0) {
      return { sent: 0, reason: 'NO_ACTIVE_TOKENS' };
    }

    const messages = tokens.map((t: any) => ({
      to: t.token,
      title: message.title,
      body: message.body,
      data: message.data || {},
      sound: message.sound || 'default',
      priority: message.priority || 'high',
    }));

    try {
      // In production or test environment, post to Expo push API
      if (typeof fetch === 'function') {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(messages),
        });

        if (response.ok) {
          const result = (await response.json()) as any;
          // Check for DeviceNotRegistered and deactivate invalid tokens
          if (result?.data && Array.isArray(result.data)) {
            for (let i = 0; i < result.data.length; i++) {
              const ticket = result.data[i];
              if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
                const invalidToken = tokens[i]?.token;
                if (invalidToken) {
                  await db.devicePushToken.update({
                    where: { token: invalidToken },
                    data: { isActive: false },
                  }).catch(() => {});
                }
              }
            }
          }
        }
      }
    } catch {
      // safe fallback if external network is unavailable
    }

    return {
      sent: messages.length,
      recipients: tokens.map((t: any) => t.token),
    };
  }
}
