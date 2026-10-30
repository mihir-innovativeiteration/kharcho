import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HighlightInsightCard } from '@/components/insights/HighlightInsightCard';
import { IncomeExpenseChart } from '@/components/insights/IncomeExpenseChart';
import { SpendingBreakdownChart } from '@/components/insights/SpendingBreakdownChart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { BarChart3, Sparkles } from 'lucide-react-native';

export default function InsightsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    insights,
    isInsightsLoading,
    refreshInsights,
    showPreviewData,
    setShowPreviewData,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'this_month' | 'last_3_months' | 'year_to_date'>('this_month');

  useEffect(() => {
    void refreshInsights(period);
  }, [period, refreshInsights]);

  useFocusEffect(
    useCallback(() => {
      void refreshInsights(period);
    }, [period, refreshInsights])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshInsights(period);
    setRefreshing(false);
  };

  const hasData =
    insights &&
    (insights.totalIncome > 0 ||
      insights.totalExpense > 0 ||
      (insights.categoryBreakdown && insights.categoryBreakdown.length > 0));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brandAccent}
            colors={[theme.colors.brandAccent]}
          />
        }
      >
        <ScreenHeader
          title="Insights"
          subtitle="Financial trends & behavioral analytics"
        />

        {/* Period Selector */}
        <SegmentedControl
          options={[
            { value: 'this_month', label: 'This Month' },
            { value: 'last_3_months', label: 'Last 3 Months' },
            { value: 'year_to_date', label: 'Year 2026' },
          ]}
          value={period}
          onChange={setPeriod}
          style={styles.segmentedControl}
        />

        {/* Demo Indicator (only visible if reviewer demo mode is explicitly active) */}
        {showPreviewData && (
          <View style={styles.demoRow}>
            <Text style={[styles.demoNote, { color: theme.colors.textMuted }]}>
              Analytics based on sample data
            </Text>
            <Button
              title="Turn Demo Off"
              onPress={() => setShowPreviewData(false)}
              variant="ghost"
              size="sm"
              leftIcon={<Sparkles size={12} color={theme.colors.brandAccent} />}
              textStyle={{ fontSize: 11 }}
            />
          </View>
        )}

        {isInsightsLoading && !refreshing ? (
          <LoadingState message="Calculating financial insights..." />
        ) : !hasData ? (
          <EmptyState
            icon={<BarChart3 size={40} color={theme.colors.brandAccent} strokeWidth={1.8} />}
            title="Insufficient Analytics Data"
            description="Add transactions to reveal cash flow ratios, category distribution, and behavioral patterns."
            actionTitle="Add Transaction"
            onAction={() =>
              router.push({
                pathname: '/transaction/new',
                params: { type: 'expense' },
              } as any)
            }
          />
        ) : (
          <>
            {/* Top Stat Overview */}
            <View style={styles.statsRow}>
              <SummaryCard
                title="Net Savings"
                amount={insights.netSavings}
                type="income"
                subtitle="Inflow minus Outflow"
              />
              <SummaryCard
                title="Savings Rate"
                amount={insights.savingsRate}
                type="savings"
                subtitle="Target: 30%+"
              />
            </View>

            {/* Income vs Expense Chart */}
            <IncomeExpenseChart data={insights.monthlyComparison} />

            {/* Category Portfolio Breakdown */}
            <SpendingBreakdownChart categories={insights.categoryBreakdown} />

            {/* Behavioral Financial Insights */}
            <SectionHeader
              title="Key Observations"
              subtitle="Data-driven highlights for this month"
            />

            {insights.highlightInsights.map((item) => (
              <HighlightInsightCard key={item.id} insight={item} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  segmentedControl: {
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoNote: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
});
