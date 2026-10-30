import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { SavingsGoal } from '@/types/budget';
import { formatINR } from '@/utils/currency';
import {
  Calendar,
  CheckCircle2,
  PiggyBank,
  Plus,
  Shield,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react-native';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onContribute: (goal: SavingsGoal) => void;
  onDelete?: (goalId: string) => void;
  onPress?: () => void;
}

export function SavingsGoalCard({
  goal,
  onContribute,
  onDelete,
  onPress,
}: SavingsGoalCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const isCompleted = goal.isCompleted || goal.status === 'COMPLETED' || goal.completionPercentage >= 100;

  const renderIcon = () => {
    const iconColor = goal.color || theme.colors.brandAccent;
    const size = 20;

    switch (goal.icon) {
      case 'Shield':
        return <Shield size={size} color={iconColor} strokeWidth={2.2} />;
      case 'Target':
        return <Target size={size} color={iconColor} strokeWidth={2.2} />;
      case 'Sparkles':
        return <Sparkles size={size} color={iconColor} strokeWidth={2.2} />;
      default:
        return <PiggyBank size={size} color={iconColor} strokeWidth={2.2} />;
    }
  };

  return (
    <Card padding="md" style={styles.card} onPress={onPress}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: theme.isDark ? '#142E25' : '#ECFDF5',
              },
            ]}
          >
            {renderIcon()}
          </View>
          <View style={styles.titleColumn}>
            <Text
              style={[
                styles.goalName,
                { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.semiBold },
              ]}
              numberOfLines={1}
            >
              {goal.name}
            </Text>
            {goal.description ? (
              <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {goal.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Completion Pill */}
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isCompleted ? theme.colors.incomeLight : theme.colors.surfaceSubtle,
            },
          ]}
        >
          {isCompleted ? (
            <CheckCircle2 size={12} color={theme.colors.income} strokeWidth={2.4} />
          ) : null}
          <Text
            style={[
              styles.statusText,
              {
                color: isCompleted ? theme.colors.income : theme.colors.brandAccent,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {isCompleted ? t('savings.completed', 'Completed') : `${goal.completionPercentage}%`}
          </Text>
        </View>
      </View>

      {/* Figures Row */}
      <View style={styles.figuresRow}>
        <View>
          <Text style={[styles.figureLabel, { color: theme.colors.textMuted }]}>
            {t('savings.savedSoFar', 'Saved so far')}
          </Text>
          <Text
            style={[
              styles.savedAmount,
              { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.bold },
            ]}
          >
            {formatINR(goal.totalSaved)}
          </Text>
        </View>

        <View style={styles.alignRight}>
          <Text style={[styles.figureLabel, { color: theme.colors.textMuted }]}>
            {t('savings.targetGoal', 'Target')}
          </Text>
          <Text
            style={[
              styles.targetAmount,
              { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },
            ]}
          >
            {formatINR(goal.targetAmount)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={goal.completionPercentage}
        color={isCompleted ? theme.colors.income : theme.colors.brandAccent}
        height={8}
        style={styles.progressBar}
      />

      {/* Footer Info & Actions */}
      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          {goal.targetDate ? (
            <View style={styles.datePill}>
              <Calendar size={12} color={theme.colors.textMuted} />
              <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                {new Date(goal.targetDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ) : (
            <Text style={[styles.remainingText, { color: theme.colors.textMuted }]}>
              {isCompleted
                ? t('savings.targetReached', 'Target achieved!')
                : `${formatINR(goal.remainingAmount)} ${t('savings.toGo', 'to go')}`}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {onDelete && (
            <Pressable
              onPress={() => {
                haptics.warning();
                onDelete(goal.id);
              }}
              style={[styles.deleteBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
              accessibilityLabel="Delete goal"
            >
              <Trash2 size={14} color={theme.colors.textMuted} />
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              haptics.selection();
              onContribute(goal);
            }}
            style={[styles.contributeBtn, { backgroundColor: theme.colors.brandAccent }]}
            accessibilityRole="button"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.contributeText}>
              {t('savings.addContribution', 'Contribute')}
            </Text>
          </Pressable>
        </View>
      </View>
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
    marginBottom: 12,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleColumn: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
  },
  description: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
  },
  figuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  figureLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  savedAmount: {
    fontSize: 18,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  targetAmount: {
    fontSize: 14,
  },
  progressBar: {
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flex: 1,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  remainingText: {
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  contributeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
