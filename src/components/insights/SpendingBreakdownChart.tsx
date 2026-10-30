import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';

interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  iconName: string;
}

interface SpendingBreakdownChartProps {
  categories: CategoryBreakdownItem[];
}

export function SpendingBreakdownChart({ categories }: SpendingBreakdownChartProps) {
  const { theme } = useTheme();

  if (!categories || categories.length === 0) return null;

  return (
    <Card padding="lg" style={styles.card}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.semiBold,
          },
        ]}
      >
        Category Portfolio Allocation
      </Text>

      {/* Segmented multi-color progress bar */}
      <View style={styles.segmentedBar}>
        {categories.map((cat) => (
          <View
            key={cat.categoryId}
            style={{
              width: `${cat.percentage}%`,
              backgroundColor: cat.color,
              height: 10,
            }}
          />
        ))}
      </View>

      {/* Category List */}
      <View style={styles.list}>
        {categories.map((cat, index) => (
          <View
            key={cat.categoryId}
            style={[
              styles.itemRow,
              index !== categories.length - 1 && {
                borderBottomWidth: 0.5,
                borderBottomColor: theme.colors.borderLight,
                paddingBottom: 10,
                marginBottom: 10,
              },
            ]}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
              <CategoryIcon iconName={cat.iconName} color={cat.color} size="sm" style={styles.icon} />
              <Text
                style={[
                  styles.catName,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </View>

            <View style={styles.itemRight}>
              <Text
                style={[
                  styles.amount,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.semiBold,
                  },
                ]}
              >
                {formatINR(cat.amount)}
              </Text>
              <Text style={[styles.percentage, { color: theme.colors.textMuted }]}>
                {cat.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  list: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  catName: {
    fontSize: 14,
    flex: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 11,
    marginTop: 1,
  },
});
