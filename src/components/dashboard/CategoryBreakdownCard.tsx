import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';
import { CategoryBreakdownItem } from '@/services/api/financeApi';
import { PieChart } from 'lucide-react-native';

interface CategoryBreakdownCardProps {
  categories: CategoryBreakdownItem[];
  totalExpense: number;
}

export function CategoryBreakdownCard({ categories, totalExpense }: CategoryBreakdownCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!categories || categories.length === 0 || totalExpense <= 0) {
    return (
      <Card padding="lg" style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <PieChart size={16} color={theme.colors.brandAccent} strokeWidth={2.4} />
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.semiBold,
                },
              ]}
            >
              {t('dashboard.categoryBreakdown', 'Spending Breakdown')}
            </Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            {t('dashboard.noExpensesPeriod', 'No expenses recorded for this period.')}
          </Text>
        </View>
      </Card>
    );
  }

  // Display top 5 categories
  const topCategories = categories.slice(0, 5);

  return (
    <Card padding="lg" style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <PieChart size={16} color={theme.colors.brandAccent} strokeWidth={2.4} />
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.semiBold,
              },
            ]}
          >
            {t('dashboard.categoryBreakdown', 'Spending Breakdown')}
          </Text>
        </View>
        <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
          {formatINR(totalExpense)}
        </Text>
      </View>

      {/* Category List with Visual Progress Bars */}
      <View style={styles.itemsList}>
        {topCategories.map((item) => {
          const amountNum = parseFloat(item.total) || 0;
          const percentageNum = parseFloat(item.percentage) || 0;
          const categoryColor = item.color || '#F97316';

          return (
            <View key={item.categoryId} style={styles.categoryRow}>
              <View style={styles.rowTop}>
                <View style={styles.categoryInfo}>
                  <CategoryIcon
                    iconName={item.icon || 'Utensils'}
                    color={categoryColor}
                    size="sm"
                  />
                  <Text
                    style={[
                      styles.categoryName,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fontFamily.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>

                <View style={styles.amountInfo}>
                  <Text
                    style={[
                      styles.amountText,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {formatINR(amountNum)}
                  </Text>
                  <Text style={[styles.percentageText, { color: theme.colors.textMuted }]}>
                    {percentageNum.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={percentageNum}
                color={categoryColor}
                height={5}
                style={styles.progressBar}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  itemsList: {
    gap: 12,
  },
  categoryRow: {
    paddingVertical: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 13,
    flexShrink: 1,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13,
  },
  percentageText: {
    fontSize: 10,
    marginTop: 1,
  },
  progressBar: {
    borderRadius: 3,
  },
});
