import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';

interface CategorySpendItem {
  categoryId: string;
  categoryName: string;
  color: string;
  iconName: string;
  amount: number;
  percentage: number;
}

interface CategorySpendingListProps {
  items: CategorySpendItem[];
}

export function CategorySpendingList({ items }: CategorySpendingListProps) {
  const { theme } = useTheme();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card padding="md" style={styles.card}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View
            key={item.categoryId}
            style={[
              styles.itemRow,
              !isLast && {
                borderBottomWidth: 0.5,
                borderBottomColor: theme.colors.borderLight,
                paddingBottom: 12,
                marginBottom: 12,
              },
            ]}
          >
            <CategoryIcon
              iconName={item.iconName}
              color={item.color}
              size="sm"
              style={styles.icon}
            />

            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text
                  style={[
                    styles.name,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.categoryName}
                </Text>
                <Text
                  style={[
                    styles.amount,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.semiBold,
                    },
                  ]}
                >
                  {formatINR(item.amount)}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={item.percentage}
                  color={item.color}
                  height={6}
                  style={styles.bar}
                />
                <Text style={[styles.percentage, { color: theme.colors.textMuted }]}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    flex: 1,
  },
  percentage: {
    fontSize: 11,
    minWidth: 28,
    textAlign: 'right',
  },
});
