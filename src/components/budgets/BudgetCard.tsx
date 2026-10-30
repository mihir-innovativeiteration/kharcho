import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { Budget } from '@/types/budget';
import { formatINR } from '@/utils/currency';
import { AlertCircle } from 'lucide-react-native';

interface BudgetCardProps {
  budget: Budget;
  onPress?: () => void;
}

export function BudgetCard({ budget, onPress }: BudgetCardProps) {
  const { theme } = useTheme();

  const percentage = Math.round((budget.spent / budget.amount) * 100);
  const remaining = budget.amount - budget.spent;
  const isOver = budget.spent > budget.amount;
  const isNearLimit = percentage >= 85 && !isOver;

  const category = budget.category;

  return (
    <Card onPress={onPress} padding="md" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <CategoryIcon
            iconName={category?.iconName || 'Tag'}
            color={category?.color || theme.colors.brandPrimary}
            size="sm"
            style={styles.icon}
          />
          <View>
            <Text
              style={[
                styles.categoryName,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.semiBold,
                },
              ]}
              numberOfLines={1}
            >
              {category?.name || 'Category'}
            </Text>
            <Text style={[styles.spentSubtext, { color: theme.colors.textMuted }]}>
              {formatINR(budget.spent)} of {formatINR(budget.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.rightNumbers}>
          <Text
            style={[
              styles.percentage,
              {
                color: isOver
                  ? theme.colors.expense
                  : isNearLimit
                  ? theme.colors.warning
                  : theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {percentage}%
          </Text>
          <Text
            style={[
              styles.remainingBadge,
              {
                color: isOver ? theme.colors.expense : theme.colors.textMuted,
              },
            ]}
          >
            {isOver ? `Exceeded ${formatINR(Math.abs(remaining))}` : `${formatINR(remaining)} left`}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={percentage}
        autoColorByThreshold
        height={6}
        style={styles.progressBar}
      />

      {isNearLimit && (
        <View
          style={[
            styles.warningBanner,
            {
              backgroundColor: theme.colors.warningLight,
            },
          ]}
        >
          <AlertCircle size={13} color={theme.colors.warning} strokeWidth={2.2} />
          <Text
            style={[
              styles.warningText,
              {
                color: theme.colors.warning,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            You are near your spending limit for this category.
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  spentSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  rightNumbers: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  remainingBadge: {
    fontSize: 11,
    marginTop: 2,
  },
  progressBar: {
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  warningText: {
    fontSize: 11,
  },
});
