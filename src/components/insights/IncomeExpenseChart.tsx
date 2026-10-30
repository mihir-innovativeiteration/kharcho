import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Card } from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';

interface MonthlyComparison {
  month: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyComparison[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const { theme } = useTheme();

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.income, d.expense]),
    1
  );

  const chartHeight = 130;
  const groupWidth = 60;
  const barWidth = 14;
  const barGap = 4;
  const totalSvgWidth = data.length * groupWidth;

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.headerRow}>
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
            Income vs. Expenses
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Cashflow Overview
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.income }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>In</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.expense }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Out</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg height={chartHeight} width="100%" viewBox={`0 0 ${totalSvgWidth} ${chartHeight}`}>
          {/* Baseline grid */}
          <Line
            x1="0"
            y1={chartHeight - 20}
            x2={totalSvgWidth}
            y2={chartHeight - 20}
            stroke={theme.colors.border}
            strokeWidth="1"
          />

          {data.map((item, index) => {
            const groupX = index * groupWidth + (groupWidth - (barWidth * 2 + barGap)) / 2;

            const incomeBarHeight = Math.max((item.income / maxVal) * (chartHeight - 34), 4);
            const expenseBarHeight = Math.max((item.expense / maxVal) * (chartHeight - 34), 4);

            const incomeY = chartHeight - 20 - incomeBarHeight;
            const expenseY = chartHeight - 20 - expenseBarHeight;

            return (
              <React.Fragment key={item.month}>
                {/* Income Bar */}
                <Rect
                  x={groupX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeBarHeight}
                  rx={4}
                  fill={theme.colors.income}
                />
                {/* Expense Bar */}
                <Rect
                  x={groupX + barWidth + barGap}
                  y={expenseY}
                  width={barWidth}
                  height={expenseBarHeight}
                  rx={4}
                  fill={theme.colors.expense}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Month Labels */}
      <View style={styles.labelsRow}>
        {data.map((item) => (
          <Text
            key={item.month}
            style={[
              styles.monthLabel,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {item.month}
          </Text>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  monthLabel: {
    fontSize: 12,
  },
});
