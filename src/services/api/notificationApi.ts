import { authApi } from './authApi';
import { NotificationPreferences } from '@/types/sync';

class NotificationApiClient {
  /**
   * Register device push token with backend
   */
  async registerToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    if (!authApi.getAccessToken()) return;

    try {
      await authApi.request('/notifications/device-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform }),
      });
    } catch (e) {
      console.warn('Failed to register push token with backend:', e);
    }
  }

  /**
   * Unregister device push token (e.g. on user logout)
   */
  async unregisterToken(token: string): Promise<void> {
    if (!authApi.getAccessToken()) return;

    try {
      await authApi.request('/notifications/device-token', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });
    } catch {
      // safe ignore
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    if (!authApi.getAccessToken()) {
      return {
        budgetAlertsEnabled: true,
        billRemindersEnabled: true,
        savingsMilestonesEnabled: true,
        syncAlertsEnabled: true,
        dailySummaryEnabled: false,
      };
    }

    try {
      const res = await authApi.request<{
        success: boolean;
        data: NotificationPreferences;
      }>('/notifications/preferences', {
        method: 'GET',
      });
      return res.data;
    } catch {
      return {
        budgetAlertsEnabled: true,
        billRemindersEnabled: true,
        savingsMilestonesEnabled: true,
        syncAlertsEnabled: true,
        dailySummaryEnabled: false,
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    if (!authApi.getAccessToken()) {
      return {
        budgetAlertsEnabled: true,
        billRemindersEnabled: true,
        savingsMilestonesEnabled: true,
        syncAlertsEnabled: true,
        dailySummaryEnabled: false,
        ...prefs,
      };
    }

    const res = await authApi.request<{
      success: boolean;
      data: NotificationPreferences;
    }>('/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    });

    return res.data;
  }
}

export const notificationApiClient = new NotificationApiClient();
