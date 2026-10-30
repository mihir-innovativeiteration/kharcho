import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Card } from './Card';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react-native';

interface SummaryCardProps {
  title: string;
  amount: number;
  type?: 'income' | 'expense' | 'neutral' | 'savings';
  trendPercentage?: number;
  subtitle?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SummaryCard({
  title,
  amount,
  type = 'neutral',
  trendPercentage,
  subtitle,
  onPress,
  style,
}: SummaryCardProps) {
  const { theme } = useTheme();

  const getTypeColor = () => {
    switch (type) {
      case 'income':
        return theme.colors.income;
      case 'expense':
        return theme.colors.expense;
      case 'savings':
        return theme.colors.brandAccent;
      default:
        return theme.colors.textPrimary;
    }
  };

  const getTypeBg = () => {
    switch (type) {
      case 'income':
        return theme.colors.incomeLight;
      case 'expense':
        return theme.colors.expenseLight;
      case 'savings':
        return theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
      default:
        return theme.colors.surfaceSubtle;
    }
  };

  const renderIcon = () => {
    const iconSize = 16;
    if (type === 'income') {
      return <ArrowDownLeft size={iconSize} color={theme.colors.income} strokeWidth={2.5} />;
    }
    if (type === 'expense') {
      return <ArrowUpRight size={iconSize} color={theme.colors.expense} strokeWidth={2.5} />;
    }
    return <TrendingUp size={iconSize} color={theme.colors.brandAccent} strokeWidth={2.5} />;
  };

  return (
    <Card onPress={onPress} padding="md" style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: getTypeBg() }]}>{renderIcon()}</View>
        <Text
          style={[styles.title, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          {
            color: getTypeColor(),
            fontFamily: theme.typography.fontFamily.bold,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {type === 'savings' ? `${amount.toFixed(1)}%` : formatINR(amount)}
      </Text>

      {trendPercentage !== undefined && (
        <View style={styles.trendRow}>
          <Text
            style={[
              styles.trendText,
              {
                color:
                  trendPercentage >= 0
                    ? type === 'expense'
                      ? theme.colors.expense
                      : theme.colors.income
                    : type === 'expense'
                    ? theme.colors.income
                    : theme.colors.expense,
              },
            ]}
          >
            {trendPercentage >= 0 ? `+${trendPercentage}%` : `${trendPercentage}%`}{' '}
            <Text style={{ color: theme.colors.textMuted }}>vs last month</Text>
          </Text>
        </View>
      )}

      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
});
