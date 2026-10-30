import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Calendar, Pause, Play, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { RecurringRule } from '@/types/recurring';
import { formatINR } from '@/utils/currency';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';

interface RecurringRuleCardProps {
  rule: RecurringRule;
  onPauseToggle: (rule: RecurringRule) => void;
  onDelete: (rule: RecurringRule) => void;
  onPress?: () => void;
}

export function RecurringRuleCard({
  rule,
  onPauseToggle,
  onDelete,
  onPress,
}: RecurringRuleCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const isIncome = rule.type === 'INCOME';
  const isPaused = rule.status === 'PAUSED';
  const isCancelled = rule.status === 'CANCELLED';

  const dueDate = new Date(rule.nextDueAt);
  const formattedDueDate = dueDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card padding="md" style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <CategoryIcon
            iconName={rule.category?.iconName || rule.category?.icon || (isIncome ? 'Briefcase' : 'Tag')}
            color={rule.category?.color || (isIncome ? theme.colors.income : theme.colors.brandPrimary)}
            size="md"
            style={styles.icon}
          />
          <View style={styles.details}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.semiBold,
                  },
                ]}
                numberOfLines={1}
              >
                {rule.title}
              </Text>

              {/* Status pill */}
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isPaused
                      ? 'rgba(245, 158, 11, 0.12)'
                      : isCancelled
                      ? 'rgba(156, 163, 175, 0.12)'
                      : 'rgba(16, 185, 129, 0.12)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isPaused
                        ? theme.colors.warning
                        : isCancelled
                        ? theme.colors.textMuted
                        : theme.colors.income,
                    },
                  ]}
                >
                  {rule.status}
                </Text>
              </View>
            </View>

            {rule.providerName ? (
              <Text style={[styles.provider, { color: theme.colors.textMuted }]}>
                {rule.providerName}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={[styles.frequencyBadge, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.frequencyText, { color: theme.colors.textSecondary }]}>
                  {t(`recurring.frequency.${rule.frequency}`)}
                </Text>
              </View>

              <View style={styles.dueDateBadge}>
                <Calendar size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.dueDateText, { color: theme.colors.textMuted }]}>
                  {formattedDueDate}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Amount & Actions */}
        <View style={styles.rightSection}>
          <Text
            style={[
              styles.amount,
              {
                color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {isIncome ? '+' : '-'} {formatINR(rule.amount)}
          </Text>

          <View style={styles.actionsRow}>
            {/* Pause / Resume button */}
            {!isCancelled && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onPauseToggle(rule);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.actionBtn, { backgroundColor: theme.colors.background }]}
              >
                {isPaused ? (
                  <Play size={14} color={theme.colors.brandPrimary} />
                ) : (
                  <Pause size={14} color={theme.colors.warning} />
                )}
              </TouchableOpacity>
            )}

            {/* Delete button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onDelete(rule);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.actionBtn, { backgroundColor: theme.colors.background }]}
            >
              <Trash2 size={14} color={theme.colors.expense} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  icon: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    flexShrink: 1,
  },
  provider: {
    fontSize: 12,
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 11,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
