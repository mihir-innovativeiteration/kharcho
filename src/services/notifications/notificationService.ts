import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationApiClient } from '../api/notificationApi';

// Configure default notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isConfigured = false;
  private currentPushToken: string | null = null;

  /**
   * Request push notification permissions and register token with backend
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      // Android requires a notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Kharcho Alerts',
          importance: 4, // Android IMPORTANCE_HIGH
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.currentPushToken = tokenData.data;

      // Register with backend
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      await notificationApiClient.registerToken(tokenData.data, platform);

      this.isConfigured = true;
      return tokenData.data;
    } catch (err) {
      console.warn('Push notification registration warning:', err);
      return null;
    }
  }

  /**
   * Unregister device push token (e.g. on user logout)
   */
  async unregisterDeviceToken(): Promise<void> {
    if (this.currentPushToken) {
      try {
        await notificationApiClient.unregisterToken(this.currentPushToken);
      } catch {
        // safe ignore
      }
      this.currentPushToken = null;
    }
  }

  /**
   * Schedule a local notification for an upcoming recurring bill
   * Uses deterministic identifier `kharcho-bill-${occurrenceId}` to prevent duplicates
   */
  async scheduleBillReminder(params: {
    occurrenceId: string;
    title: string;
    amount: number;
    dueDate: Date;
    reminderDaysBefore?: number;
  }): Promise<string | null> {
    try {
      const { occurrenceId, title, amount, dueDate, reminderDaysBefore = 1 } = params;
      const identifier = `kharcho-bill-${occurrenceId}`;

      // Cancel any existing schedule for this occurrence
      await Notifications.cancelScheduledNotificationAsync(identifier);

      // Calculate notification target trigger date
      const triggerDate = new Date(dueDate);
      triggerDate.setDate(triggerDate.getDate() - reminderDaysBefore);
      triggerDate.setHours(9, 0, 0, 0); // 9:00 AM local time

      // If scheduled date has already elapsed, do not trigger past reminder
      if (triggerDate.getTime() <= Date.now()) {
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Upcoming Bill: ${title}`,
          body: `₹${amount.toLocaleString('en-IN')} is due on ${dueDate.toLocaleDateString()}. Tap to view.`,
          data: { occurrenceId, type: 'BILL_REMINDER' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      return id;
    } catch (err) {
      console.warn('Failed to schedule local bill notification:', err);
      return null;
    }
  }

  /**
   * Cancel local bill notification when bill is marked PAID or cancelled
   */
  async cancelBillReminder(occurrenceId: string): Promise<void> {
    try {
      const identifier = `kharcho-bill-${occurrenceId}`;
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      // safe ignore
    }
  }

  /**
   * Deliver an immediate local budget alert notification
   */
  async presentBudgetAlert(params: {
    budgetId: string;
    budgetName: string;
    percent: number;
  }): Promise<void> {
    try {
      const identifier = `kharcho-budget-${params.budgetId}-${params.percent}`;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Budget Alert: ${params.budgetName}`,
          body: `You have reached ${params.percent}% of your budget limit.`,
          data: { budgetId: params.budgetId, percent: params.percent },
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    } catch (err) {
      console.warn('Failed to present budget alert:', err);
    }
  }
}

export const notificationService = new NotificationService();
