import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { BudgetAlert } from '@/types/budget';
import { AlertCircle, AlertTriangle, Bell, CheckCheck, X } from 'lucide-react-native';

interface BudgetAlertsModalProps {
  visible: boolean;
  alerts: BudgetAlert[];
  unreadCount: number;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export function BudgetAlertsModal({
  visible,
  alerts,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: BudgetAlertsModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const getThresholdBadge = (percent: number) => {
    if (percent >= 100) {
      return {
        bg: theme.colors.expenseLight,
        color: theme.colors.expense,
        label: `${percent}% Limit Exceeded`,
        icon: AlertCircle,
      };
    }
    if (percent >= 80) {
      return {
        bg: theme.colors.warningLight,
        color: theme.colors.warning,
        label: `${percent}% Warning Threshold`,
        icon: AlertTriangle,
      };
    }
    return {
      bg: theme.isDark ? '#142E25' : '#ECFDF5',
      color: theme.colors.brandAccent,
      label: `${percent}% Utilization Reached`,
      icon: Bell,
    };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.colors.surfaceElevated }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.colors.borderLight }]}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.bold },
                ]}
              >
                {t('alerts.centerTitle', 'Budget Spending Alerts')}
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.expense }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    void onMarkAllRead();
                  }}
                  style={[styles.markAllBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
                >
                  <CheckCheck size={14} color={theme.colors.brandAccent} />
                  <Text style={[styles.markAllText, { color: theme.colors.brandAccent }]}>
                    {t('alerts.markAllRead', 'Read all')}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
                accessibilityLabel="Close"
              >
                <X size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* List or Empty State */}
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {alerts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: theme.isDark ? '#142E25' : '#ECFDF5' },
                  ]}
                >
                  <Bell size={28} color={theme.colors.brandAccent} strokeWidth={2} />
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.bold },
                  ]}
                >
                  {t('alerts.emptyTitle', 'No Alerts Yet')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                  {t(
                    'alerts.emptySubtitle',
                    'You are staying well within all your budgets. When you reach 50%, 80%, or 100% of a limit, you will see it here.'
                  )}
                </Text>
              </View>
            ) : (
              alerts.map((alert) => {
                const badge = getThresholdBadge(alert.thresholdPercent);
                const BadgeIcon = badge.icon;
                const dateStr = new Date(alert.triggeredAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <Pressable
                    key={alert.id}
                    onPress={() => {
                      if (!alert.isRead) {
                        haptics.selection();
                        void onMarkRead(alert.id);
                      }
                    }}
                    style={[
                      styles.alertCard,
                      {
                        backgroundColor: alert.isRead
                          ? theme.colors.surfaceSubtle
                          : theme.isDark
                          ? '#162822'
                          : '#F0FDF4',
                        borderColor: alert.isRead ? theme.colors.borderLight : theme.colors.brandAccent,
                      },
                    ]}
                  >
                    <View style={styles.alertTop}>
                      <View style={[styles.thresholdPill, { backgroundColor: badge.bg }]}>
                        <BadgeIcon size={12} color={badge.color} strokeWidth={2.4} />
                        <Text style={[styles.thresholdText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                      <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                        {dateStr}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.alertMessage,
                        {
                          color: theme.colors.textPrimary,
                          fontFamily: alert.isRead
                            ? theme.typography.fontFamily.medium
                            : theme.typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {alert.budgetName} has reached {alert.thresholdPercent}% of its limit for {alert.periodKey}.
                    </Text>

                    <View style={styles.alertBottom}>
                      <Text style={[styles.periodText, { color: theme.colors.textMuted }]}>
                        Period: {alert.periodKey}
                      </Text>
                      {!alert.isRead && (
                        <View style={styles.unreadIndicator}>
                          <View
                            style={[
                              styles.unreadDot,
                              { backgroundColor: theme.colors.brandAccent },
                            ]}
                          />
                          <Text style={[styles.unreadLabel, { color: theme.colors.brandAccent }]}>
                            {t('alerts.unread', 'New')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  alertCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  thresholdText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 11,
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unreadLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
