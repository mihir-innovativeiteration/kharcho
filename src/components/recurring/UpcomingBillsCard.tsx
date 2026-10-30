import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, ChevronRight, Clock, FastForward, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { RecurringOccurrence } from '@/types/recurring';
import { formatINR } from '@/utils/currency';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';

interface UpcomingBillsCardProps {
  occurrences: RecurringOccurrence[];
  loading?: boolean;
  onConfirmPaid: (occ: RecurringOccurrence) => void;
  onSkip: (occ: RecurringOccurrence) => void;
}

export function UpcomingBillsCard({
  occurrences,
  loading = false,
  onConfirmPaid,
  onSkip,
}: UpcomingBillsCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  if (loading) {
    return (
      <Card padding="md" style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            {t('common.loading')}
          </Text>
        </View>
      </Card>
    );
  }

  const activeOccurrences = occurrences.filter((o) =>
    ['UPCOMING', 'DUE', 'AWAITING_CONFIRMATION'].includes(o.status)
  );

  return (
    <Card padding="md" style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <Calendar size={14} color={theme.colors.brandPrimary} />
          </View>
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.semiBold,
                },
              ]}
            >
              {t('recurring.upcomingTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {t('recurring.upcomingSubtitle')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/recurring' as any);
          }}
          style={styles.viewAllBtn}
        >
          <Text
            style={[
              styles.viewAllText,
              {
                color: theme.colors.brandPrimary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {t('common.continue')}
          </Text>
          <ChevronRight size={14} color={theme.colors.brandPrimary} />
        </TouchableOpacity>
      </View>

      {/* Occurrences List */}
      {activeOccurrences.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShieldCheck size={28} color={theme.colors.income} style={{ marginBottom: 6 }} />
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            All bills clear this week
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            No scheduled bills or EMIs due in the next 7 days.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {activeOccurrences.slice(0, 3).map((occ) => {
            const rule = occ.rule;
            const isIncome = rule?.type === 'INCOME';
            const scheduled = new Date(occ.scheduledAt);
            const now = new Date();
            const diffDays = Math.ceil(
              (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            let dueLabel = '';
            let dueColor = theme.colors.textMuted;
            if (diffDays <= 0) {
              dueLabel = t('recurring.dueToday');
              dueColor = theme.colors.expense;
            } else if (diffDays === 1) {
              dueLabel = 'Due tomorrow';
              dueColor = theme.colors.warning;
            } else {
              dueLabel = t('recurring.dueInDays', { count: diffDays });
              dueColor = theme.colors.textSecondary;
            }

            return (
              <View
                key={occ.id}
                style={[
                  styles.occRow,
                  {
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <CategoryIcon
                  iconName={rule?.category?.iconName || rule?.category?.icon || (isIncome ? 'Briefcase' : 'CreditCard')}
                  color={
                    rule?.category?.color ||
                    (isIncome ? theme.colors.income : theme.colors.brandPrimary)
                  }
                  size="sm"
                  style={styles.occIcon}
                />

                <View style={styles.occDetails}>
                  <Text
                    style={[
                      styles.occTitle,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fontFamily.semiBold,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {rule?.title || 'Bill'}
                  </Text>
                  <View style={styles.dueRow}>
                    <Clock size={11} color={dueColor} style={{ marginRight: 3 }} />
                    <Text
                      style={[
                        styles.dueText,
                        {
                          color: dueColor,
                          fontFamily: theme.typography.fontFamily.medium,
                        },
                      ]}
                    >
                      {dueLabel}
                    </Text>
                    {rule?.providerName ? (
                      <Text style={[styles.providerDot, { color: theme.colors.textMuted }]}>
                        • {rule.providerName}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.occRight}>
                  <Text
                    style={[
                      styles.occAmount,
                      {
                        color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {formatINR(rule?.amount || 0)}
                  </Text>

                  <View style={styles.actions}>
                    {/* Confirm Paid button */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        onConfirmPaid(occ);
                      }}
                      style={[
                        styles.quickConfirmBtn,
                        {
                          backgroundColor: isIncome
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(59, 130, 246, 0.12)',
                        },
                      ]}
                    >
                      <CheckCircle2
                        size={12}
                        color={isIncome ? theme.colors.income : theme.colors.brandPrimary}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          styles.quickConfirmText,
                          {
                            color: isIncome ? theme.colors.income : theme.colors.brandPrimary,
                            fontFamily: theme.typography.fontFamily.semiBold,
                          },
                        ]}
                      >
                        {isIncome ? 'Received' : 'Paid'}
                      </Text>
                    </TouchableOpacity>

                    {/* Skip button */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        onSkip(occ);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.skipBtn}
                    >
                      <FastForward size={14} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 11,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 11,
  },
  list: {
    marginTop: 4,
  },
  occRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  occIcon: {
    marginRight: 10,
  },
  occDetails: {
    flex: 1,
    paddingRight: 8,
  },
  occTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 11,
  },
  providerDot: {
    fontSize: 11,
    marginLeft: 4,
  },
  occRight: {
    alignItems: 'flex-end',
  },
  occAmount: {
    fontSize: 14,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quickConfirmText: {
    fontSize: 11,
  },
  skipBtn: {
    padding: 3,
  },
});
