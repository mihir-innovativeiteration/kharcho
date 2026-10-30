import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Card } from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';

interface TrendPoint {
  date: string;
  amount: number;
}

interface ExpenseTrendChartProps {
  data: TrendPoint[];
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  const { theme } = useTheme();

  if (!data || data.length === 0) return null;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const chartHeight = 90;
  const barWidth = 14;
  const spacing = 18;
  const totalSvgWidth = data.length * (barWidth + spacing);

  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.semiBold,
            },
          ]}
        >
          Daily Spending Momentum
        </Text>
        <Text style={[styles.subtext, { color: theme.colors.textMuted }]}>
          Peak: {formatINR(maxAmount, { compact: true })}
        </Text>
      </View>

      <View style={styles.chartWrapper}>
        <Svg height={chartHeight} width="100%" viewBox={`0 0 ${totalSvgWidth} ${chartHeight}`}>
          {/* Baseline */}
          <Line
            x1="0"
            y1={chartHeight - 4}
            x2={totalSvgWidth}
            y2={chartHeight - 4}
            stroke={theme.colors.border}
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          {data.map((point, index) => {
            const barHeight = Math.max((point.amount / maxAmount) * (chartHeight - 16), 4);
            const x = index * (barWidth + spacing) + spacing / 2;
            const y = chartHeight - barHeight - 6;
            const isPeak = point.amount === maxAmount;

            return (
              <Rect
                key={point.date}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill={isPeak ? theme.colors.brandAccent : theme.isDark ? '#234439' : '#D1FAE5'}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.labelsRow}>
        {data.map((point) => (
          <Text
            key={point.date}
            style={[
              styles.dateLabel,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
          >
            {point.date}
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
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 11,
  },
});
