import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { BudgetSummary } from '@/types/budget';
import { formatINR } from '@/utils/currency';
import { AlertTriangle, CheckCircle, PieChart } from 'lucide-react-native';

interface BudgetOverviewCardProps {
  summary: BudgetSummary;
  month?: string;
}

export function BudgetOverviewCard({
  summary,
  month = 'October 2026',
}: BudgetOverviewCardProps) {
  const { theme } = useTheme();

  const isOver = summary.isOverBudget;
  const isNearLimit = summary.percentageUsed >= 85 && !isOver;

  return (
    <Card padding="xl" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leftLabel}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.isDark ? '#142E25' : '#ECFDF5',
              },
            ]}
          >
            <PieChart size={18} color={theme.colors.brandAccent} strokeWidth={2.2} />
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
              Monthly Budget Cap
            </Text>
            <Text style={[styles.monthText, { color: theme.colors.textMuted }]}>{month}</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isOver
                ? theme.colors.expenseLight
                : isNearLimit
                ? theme.colors.warningLight
                : theme.colors.incomeLight,
            },
          ]}
        >
          {isOver ? (
            <AlertTriangle size={12} color={theme.colors.expense} strokeWidth={2.4} />
          ) : (
            <CheckCircle size={12} color={theme.colors.income} strokeWidth={2.4} />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color: isOver
                  ? theme.colors.expense
                  : isNearLimit
                  ? theme.colors.warning
                  : theme.colors.income,
              },
            ]}
          >
            {isOver ? 'Over Budget' : `${summary.percentageUsed}% Spent`}
          </Text>
        </View>
      </View>

      {/* Main Budget Progress and Figures */}
      <View style={styles.numbersRow}>
        <View>
          <Text style={[styles.subLabel, { color: theme.colors.textMuted }]}>Spent so far</Text>
          <Text
            style={[
              styles.bigAmount,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {formatINR(summary.totalSpent)}
          </Text>
        </View>

        <View style={styles.rightNumber}>
          <Text style={[styles.subLabel, { color: theme.colors.textMuted }]}>Total Allocated</Text>
          <Text
            style={[
              styles.targetAmount,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {formatINR(summary.totalBudget)}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={summary.percentageUsed}
        autoColorByThreshold
        height={10}
        style={styles.progressBar}
      />

      <View style={styles.footerRow}>
        <Text style={[styles.remainingText, { color: theme.colors.textSecondary }]}>
          {isOver ? (
            <Text style={{ color: theme.colors.expense, fontWeight: '700' }}>
              Exceeded by {formatINR(summary.totalSpent - summary.totalBudget)}
            </Text>
          ) : (
            <>
              <Text
                style={{
                  color: theme.colors.brandAccent,
                  fontFamily: theme.typography.fontFamily.bold,
                }}
              >
                {formatINR(summary.remaining)}
              </Text>{' '}
              remaining for this month
            </>
          )}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthText: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  bigAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rightNumber: {
    alignItems: 'flex-end',
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 13,
  },
});
