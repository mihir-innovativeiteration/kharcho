import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { CategoryBreakdownCard } from '@/components/dashboard/CategoryBreakdownCard';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { HeroBalanceCard } from '@/components/dashboard/HeroBalanceCard';
import { IncomeExpenseTrendChart } from '@/components/dashboard/IncomeExpenseTrendChart';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard';
import { UpcomingBillsCard } from '@/components/recurring/UpcomingBillsCard';
import { ConfirmPaidModal } from '@/components/recurring/ConfirmPaidModal';
import { SyncStatusBar } from '@/components/ui/SyncStatusBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { recurringApiClient } from '@/services/api/recurringApi';
import { notificationService } from '@/services/notifications/notificationService';
import { RecurringOccurrence } from '@/types/recurring';
import { Sparkles } from 'lucide-react-native';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { showPreviewData, setShowPreviewData } = useApp();

  const [upcomingOccurrences, setUpcomingOccurrences] = useState<RecurringOccurrence[]>([]);
  const [loadingOccurrences, setLoadingOccurrences] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<RecurringOccurrence | null>(null);

  const {
    selectedPeriod,
    dateRange,
    summary,
    breakdown,
    trends,
    recentTransactions,
    isLoading,
    isRefreshing,
    error,
    hasData,
    onPeriodChange,
    refetch,
  } = useDashboardData();

  const fetchUpcoming = useCallback(async () => {
    try {
      const items = await recurringApiClient.getUpcomingOccurrences(7);
      setUpcomingOccurrences(items);
    } catch (e) {
      console.warn('Failed to fetch upcoming bills:', e);
    } finally {
      setLoadingOccurrences(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        void fetchUpcoming();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchUpcoming]);

  // Automatically refresh live dashboard figures whenever returning to Home tab
  useFocusEffect(
    useCallback(() => {
      void refetch();
      void fetchUpcoming();
    }, [refetch, fetchUpcoming])
  );

  const handleRefresh = async () => {
    await Promise.all([refetch(), fetchUpcoming()]);
  };

  const handleConfirmPaid = (occ: RecurringOccurrence) => {
    setSelectedOccurrence(occ);
    setConfirmModalVisible(true);
  };

  const handleSkip = async (occ: RecurringOccurrence) => {
    Alert.alert(
      t('recurring.skipOccurrence'),
      `Skip this occurrence of "${occ.rule?.title || 'Bill'}"? Next due date will advance automatically.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('recurring.skipOccurrence'),
          onPress: async () => {
            try {
              await recurringApiClient.skipOccurrence(occ.id);
              void notificationService.cancelBillReminder(occ.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchUpcoming();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to skip bill');
            }
          },
        },
      ]
    );
  };

  const incomeNum = summary ? parseFloat(summary.totalIncome) || 0 : 0;
  const expenseNum = summary ? parseFloat(summary.totalExpenses) || 0 : 0;
  const netActivityNum = summary ? parseFloat(summary.netActivity) || 0 : 0;
  const savingsRate = incomeNum > 0 ? ((incomeNum - expenseNum) / incomeNum) * 100 : 0;

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
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brandAccent}
            colors={[theme.colors.brandAccent]}
          />
        }
      >
        {/* Top Header */}
        <GreetingHeader />

        {/* Offline & Sync Status Banner */}
        <SyncStatusBar />

        {/* Date Period Selector Row */}
        <View style={styles.topControlsRow}>
          <View style={styles.periodSelectorWrapper}>
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onSelectPeriod={onPeriodChange}
            />
          </View>

          {/* Reviewer / Demo Data Toggle (only when demo is active) */}
          {showPreviewData && (
            <Button
              title="Demo: ON"
              onPress={() => setShowPreviewData(false)}
              variant="ghost"
              size="sm"
              leftIcon={<Sparkles size={12} color={theme.colors.brandAccent} />}
              textStyle={{ fontSize: 11 }}
              style={styles.demoToggleBtn}
            />
          )}
        </View>

        {/* Main Content Area */}
        {isLoading && !summary ? (
          <LoadingState message={t('dashboard.loading', 'Loading your financial dashboard...')} />
        ) : error && !summary ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !hasData ? (
          // Clean Empty State when no transactions exist in the period
          <View style={styles.emptyContainer}>
            <EmptyState
              title={t('dashboard.emptyTitle', 'No Financial Records Yet')}
              description={t(
                'dashboard.emptyDesc',
                'Start tracking your expenses and earnings to unlock personalized insights and intelligent budget monitoring.'
              )}
              actionTitle={t('dashboard.addFirstExpense', 'Add Your First Expense')}
              onAction={() =>
                router.push({
                  pathname: '/transaction/new',
                  params: { type: 'expense' },
                } as any)
              }
            />

            {!showPreviewData && (
              <Button
                title="Load Sample Demo Data"
                onPress={() => setShowPreviewData(true)}
                variant="outline"
                size="md"
                style={styles.sampleDataBtn}
              />
            )}
          </View>
        ) : (
          <>
            {/* Hero Net Activity Card (Accurately labeled net cashflow, not bank balance) */}
            <HeroBalanceCard
              netActivity={netActivityNum}
              income={incomeNum}
              expense={expenseNum}
              savingsRate={incomeNum > 0 ? Math.max(0, Math.round(savingsRate)) : undefined}
              periodLabel={dateRange.periodLabel}
              incomeChangePercentage={summary?.changes?.incomePercentage}
              expenseChangePercentage={summary?.changes?.expensePercentage}
            />

            {/* Quick Actions (Add Expense / Add Income) */}
            <QuickActions />

            {/* Upcoming Recurring Bills & EMIs Widget (Due next 7 days) */}
            <UpcomingBillsCard
              occurrences={upcomingOccurrences}
              loading={loadingOccurrences}
              onConfirmPaid={handleConfirmPaid}
              onSkip={handleSkip}
            />

            {/* Income-vs-Expense Timeline Trend Chart */}
            {trends?.timeline && trends.timeline.length > 0 && (
              <IncomeExpenseTrendChart
                timeline={trends.timeline}
                groupBy={trends.groupBy}
              />
            )}

            {/* Category-wise Spending Breakdown */}
            <CategoryBreakdownCard
              categories={breakdown?.expenses?.breakdown || []}
              totalExpense={expenseNum}
            />

            {/* Recent 5 Transactions */}
            <RecentTransactionsCard transactions={recentTransactions} />
          </>
        )}
      </ScrollView>

      {/* Quick Confirm Paid Modal */}
      <ConfirmPaidModal
        visible={confirmModalVisible}
        occurrence={selectedOccurrence}
        onClose={() => {
          setConfirmModalVisible(false);
          setSelectedOccurrence(null);
        }}
        onSuccess={() => handleRefresh()}
      />
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
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  periodSelectorWrapper: {
    flex: 1,
  },
  demoToggleBtn: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  sampleDataBtn: {
    marginTop: 16,
  },
});
