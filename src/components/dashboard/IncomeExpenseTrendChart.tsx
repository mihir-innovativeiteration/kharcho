import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';
import { TrendTimelinePoint } from '@/services/api/financeApi';
import { TrendingUp } from 'lucide-react-native';

interface IncomeExpenseTrendChartProps {
  timeline: TrendTimelinePoint[];
  groupBy?: 'day' | 'month';
}

export function IncomeExpenseTrendChart({ timeline, groupBy = 'day' }: IncomeExpenseTrendChartProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!timeline || timeline.length === 0) {
    return null;
  }

  // Calculate maximum values for SVG scaling
  const parsedPoints = timeline.map((pt) => ({
    ...pt,
    incomeNum: parseFloat(pt.income) || 0,
    expenseNum: parseFloat(pt.expense) || 0,
  }));

  const maxVal = Math.max(
    ...parsedPoints.map((p) => Math.max(p.incomeNum, p.expenseNum)),
    100
  );

  const chartHeight = 110;
  const barWidth = groupBy === 'month' ? 14 : 7;
  const groupSpacing = groupBy === 'month' ? 24 : 12;
  const pairWidth = barWidth * 2 + 2;
  const totalSvgWidth = Math.max(
    parsedPoints.length * (pairWidth + groupSpacing) + 20,
    280
  );

  const incomeColor = '#10B981'; // Emerald
  const expenseColor = theme.isDark ? '#FB7185' : '#EF4444'; // Rose / Red

  return (
    <Card padding="lg" style={styles.card}>
      {/* Title & Legend Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <TrendingUp size={16} color={theme.colors.brandAccent} strokeWidth={2.4} />
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.semiBold,
                },
              ]}
            >
              {groupBy === 'month'
                ? t('dashboard.monthlyCashflow', 'Monthly Comparison')
                : t('dashboard.dailyCashflow', 'Cashflow Dynamics')}
            </Text>
          </View>
          <Text style={[styles.subtext, { color: theme.colors.textMuted }]}>
            Peak: {formatINR(maxVal, { compact: true })}
          </Text>
        </View>

        {/* Accessible Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: incomeColor }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {t('transactions.income', 'Income')}
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: expenseColor }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {t('transactions.expense', 'Expense')}
            </Text>
          </View>
        </View>
      </View>

      {/* SVG Chart Container */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.chartArea}>
          <Svg height={chartHeight} width={totalSvgWidth} viewBox={`0 0 ${totalSvgWidth} ${chartHeight}`}>
            {/* Mid Gridline */}
            <Line
              x1="0"
              y1={chartHeight / 2}
              x2={totalSvgWidth}
              y2={chartHeight / 2}
              stroke={theme.colors.border}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity={0.5}
            />

            {/* Baseline */}
            <Line
              x1="0"
              y1={chartHeight - 4}
              x2={totalSvgWidth}
              y2={chartHeight - 4}
              stroke={theme.colors.border}
              strokeWidth="1"
            />

            {parsedPoints.map((point, index) => {
              const groupX = index * (pairWidth + groupSpacing) + 12;

              // Income Bar
              const incomeBarHeight = point.incomeNum > 0
                ? Math.max((point.incomeNum / maxVal) * (chartHeight - 18), 4)
                : 0;
              const incomeY = chartHeight - incomeBarHeight - 4;

              // Expense Bar
              const expenseBarHeight = point.expenseNum > 0
                ? Math.max((point.expenseNum / maxVal) * (chartHeight - 18), 4)
                : 0;
              const expenseY = chartHeight - expenseBarHeight - 4;

              return (
                <React.Fragment key={point.date}>
                  {incomeBarHeight > 0 && (
                    <Rect
                      x={groupX}
                      y={incomeY}
                      width={barWidth}
                      height={incomeBarHeight}
                      rx={barWidth / 2}
                      fill={incomeColor}
                    />
                  )}
                  {expenseBarHeight > 0 && (
                    <Rect
                      x={groupX + barWidth + 2}
                      y={expenseY}
                      width={barWidth}
                      height={expenseBarHeight}
                      rx={barWidth / 2}
                      fill={expenseColor}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Svg>

          {/* X-Axis Labels */}
          <View style={[styles.labelsRow, { width: totalSvgWidth }]}>
            {parsedPoints.map((point, index) => {
              const groupX = index * (pairWidth + groupSpacing) + 12;
              // For daily grouping with 30 days, skip some labels to prevent clutter
              if (groupBy === 'day' && parsedPoints.length > 15 && index % 5 !== 0 && index !== parsedPoints.length - 1) {
                return null;
              }

              return (
                <Text
                  key={point.date}
                  style={[
                    styles.axisLabel,
                    {
                      left: groupX - 6,
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {point.label || point.date.split('-').pop()}
                </Text>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
  },
  subtext: {
    fontSize: 11,
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
    fontWeight: '500',
  },
  scrollContainer: {
    paddingBottom: 4,
  },
  chartArea: {
    position: 'relative',
    height: 135,
  },
  labelsRow: {
    position: 'absolute',
    bottom: 0,
    height: 18,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    width: 32,
    textAlign: 'center',
  },
});
