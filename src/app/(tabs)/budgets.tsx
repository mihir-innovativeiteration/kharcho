import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetOverviewCard } from '@/components/budgets/BudgetOverviewCard';
import { CreateBudgetModal } from '@/components/budgets/CreateBudgetModal';
import { BudgetAlertsModal } from '@/components/budgets/BudgetAlertsModal';
import { SavingsGoalCard } from '@/components/savings/SavingsGoalCard';
import { CreateSavingsGoalModal } from '@/components/savings/CreateSavingsGoalModal';
import { AddContributionModal } from '@/components/savings/AddContributionModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { budgetApiClient, liveBudgetService } from '@/services/api/budgetApi';
import { savingsApiClient } from '@/services/api/savingsApi';
import { alertApiClient } from '@/services/api/alertApi';
import { Budget, BudgetAlert, BudgetSummary, BudgetType, SavingsGoal } from '@/types/budget';
import { Bell, PieChart, PiggyBank, Plus } from 'lucide-react-native';

type ActiveTab = 'budgets' | 'savings';

export default function BudgetsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { showPreviewData } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('budgets');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Budgets state
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);

  // Savings goals state
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  // Alerts state
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);

  // Modals state
  const [isCreateBudgetVisible, setIsCreateBudgetVisible] = useState(false);
  const [isCreateGoalVisible, setIsCreateGoalVisible] = useState(false);
  const [isAlertsVisible, setIsAlertsVisible] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<SavingsGoal | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setError(null);
      const [budgetsRes, summaryRes, goalsRes, alertsRes] = await Promise.all([
        liveBudgetService.getBudgets(),
        liveBudgetService.getBudgetSummary(),
        savingsApiClient.getGoals().catch(() => []),
        alertApiClient.getAlerts().catch(() => ({ items: [], unreadCount: 0 })),
      ]);

      setBudgets(budgetsRes.data || []);
      setBudgetSummary(summaryRes.data || null);
      setSavingsGoals(goalsRes || []);
      setAlerts(alertsRes.items || []);
      setUnreadAlertsCount(alertsRes.unreadCount || 0);
    } catch (err: any) {
      console.warn('BudgetsScreen fetch error:', err);
      setError(err?.message || t('budgets.errors.loadFailed', 'Unable to load budgets. Pull to refresh.'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        void fetchAllData();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchAllData, showPreviewData]);

  useFocusEffect(
    useCallback(() => {
      void fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  const handleTabChange = (tab: ActiveTab) => {
    haptics.selection();
    setActiveTab(tab);
  };

  const handleCreateBudgetSubmit = async (data: {
    name: string;
    type: BudgetType;
    categoryId?: string | null;
    amount: string;
    warningThresholds?: number[];
  }) => {
    await budgetApiClient.createBudget(data);
    await fetchAllData();
  };

  const handleDeleteBudget = (budgetId: string) => {
    Alert.alert(
      t('budgets.deleteTitle', 'Delete Budget'),
      t('budgets.deleteConfirm', 'Are you sure you want to delete this budget cap?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.warning();
              await budgetApiClient.deleteBudget(budgetId);
              await fetchAllData();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const handleCreateGoalSubmit = async (data: {
    name: string;
    targetAmount: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => {
    await savingsApiClient.createGoal(data);
    await fetchAllData();
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      t('savings.deleteTitle', 'Delete Savings Goal'),
      t('savings.deleteConfirm', 'Are you sure you want to remove this goal and its contribution history?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.warning();
              await savingsApiClient.deleteGoal(goalId);
              await fetchAllData();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete savings goal');
            }
          },
        },
      ]
    );
  };

  const handleAddContributionSubmit = async (
    goalId: string,
    data: { amount: string; note?: string }
  ) => {
    await savingsApiClient.addContribution(goalId, data);
    await fetchAllData();
  };

  const handleMarkAlertRead = async (alertId: string) => {
    await alertApiClient.markAlertRead(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
    setUnreadAlertsCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAlertsRead = async () => {
    await alertApiClient.markAllAlertsRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadAlertsCount(0);
  };

  const hasBudgets = budgets && budgets.length > 0;
  const hasGoals = savingsGoals && savingsGoals.length > 0;

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
          title={t('budgets.screenTitle', 'Budgets & Goals')}
          subtitle={t('budgets.screenSubtitle', 'Category limits and savings targets')}
          rightElement={
            <View style={styles.headerRightCluster}>
              {/* Alert Bell Button with Unread Badge */}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setIsAlertsVisible(true);
                }}
                style={[styles.bellBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
                accessibilityLabel="Spending Alerts"
              >
                <Bell size={20} color={theme.colors.textPrimary} />
                {unreadAlertsCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.colors.expense }]}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Add New Budget / Goal Button */}
              <IconButton
                icon={<Plus size={20} color="#FFFFFF" strokeWidth={2.5} />}
                onPress={() => {
                  haptics.selection();
                  if (activeTab === 'budgets') {
                    setIsCreateBudgetVisible(true);
                  } else {
                    setIsCreateGoalVisible(true);
                  }
                }}
                variant="brand"
                size="md"
                accessibilityLabel={activeTab === 'budgets' ? 'Create budget' : 'Create goal'}
              />
            </View>
          }
        />

        {/* Tab Segmented Control */}
        <View style={[styles.tabSegmentContainer, { backgroundColor: theme.colors.surfaceSubtle }]}>
          <Pressable
            onPress={() => handleTabChange('budgets')}
            style={[
              styles.tabSegment,
              activeTab === 'budgets' && {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <PieChart
              size={16}
              color={activeTab === 'budgets' ? theme.colors.brandAccent : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color: activeTab === 'budgets' ? theme.colors.brandAccent : theme.colors.textSecondary,
                  fontFamily:
                    activeTab === 'budgets'
                      ? theme.typography.fontFamily.semiBold
                      : theme.typography.fontFamily.regular,
                },
              ]}
            >
              {t('budgets.tabBudgets', 'Spending Caps')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange('savings')}
            style={[
              styles.tabSegment,
              activeTab === 'savings' && {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <PiggyBank
              size={16}
              color={activeTab === 'savings' ? theme.colors.brandAccent : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color: activeTab === 'savings' ? theme.colors.brandAccent : theme.colors.textSecondary,
                  fontFamily:
                    activeTab === 'savings'
                      ? theme.typography.fontFamily.semiBold
                      : theme.typography.fontFamily.regular,
                },
              ]}
            >
              {t('budgets.tabSavings', 'Savings Goals')}
            </Text>
          </Pressable>
        </View>

        {/* Main Content Area */}
        {isLoading && !refreshing ? (
          <LoadingState message={t('budgets.loading', 'Loading budgets & goals...')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAllData} />
        ) : activeTab === 'budgets' ? (
          /* ================= BUDGETS VIEW ================= */
          !hasBudgets ? (
            <EmptyState
              icon={<PieChart size={40} color={theme.colors.brandAccent} strokeWidth={1.8} />}
              title={t('budgets.emptyTitle', 'No Spending Caps Set')}
              description={t(
                'budgets.emptyDesc',
                'Create monthly spending caps for food, shopping, and fuel to keep expenses firmly under control.'
              )}
              actionTitle={t('budgets.createBtn', 'Create Your First Budget')}
              onAction={() => setIsCreateBudgetVisible(true)}
            />
          ) : (
            <>
              {/* Overall Monthly Overview Card */}
              {budgetSummary && <BudgetOverviewCard summary={budgetSummary} />}

              {/* Category Budgets List */}
              <SectionHeader
                title={t('budgets.categoryAllocations', 'Category Allocations')}
                subtitle={`${budgets.length} ${t('budgets.activeLimits', 'active spending caps')}`}
              />

              {budgets.map((b) => (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  onPress={() => handleDeleteBudget(b.id)}
                />
              ))}
            </>
          )
        ) : (
          /* ================= SAVINGS GOALS VIEW ================= */
          !hasGoals ? (
            <EmptyState
              icon={<PiggyBank size={40} color={theme.colors.brandAccent} strokeWidth={1.8} />}
              title={t('savings.emptyTitle', 'No Savings Goals Yet')}
              description={t(
                'savings.emptyDesc',
                'Set aside funds for emergencies, travel, or big milestones with manual entry tracking.'
              )}
              actionTitle={t('savings.createBtn', 'Create a Savings Goal')}
              onAction={() => setIsCreateGoalVisible(true)}
            />
          ) : (
            <>
              <SectionHeader
                title={t('savings.activeGoals', 'Active Goals')}
                subtitle={`${savingsGoals.length} ${t('savings.goalsTracking', 'milestone targets')}`}
              />

              {savingsGoals.map((goal) => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onContribute={(g) => setSelectedGoalForContribution(g)}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </>
          )
        )}
      </ScrollView>

      {/* Create Budget Modal */}
      <CreateBudgetModal
        visible={isCreateBudgetVisible}
        onClose={() => setIsCreateBudgetVisible(false)}
        onSubmit={handleCreateBudgetSubmit}
      />

      {/* Create Savings Goal Modal */}
      <CreateSavingsGoalModal
        visible={isCreateGoalVisible}
        onClose={() => setIsCreateGoalVisible(false)}
        onSubmit={handleCreateGoalSubmit}
      />

      {/* Add Contribution Modal */}
      <AddContributionModal
        visible={Boolean(selectedGoalForContribution)}
        goal={selectedGoalForContribution}
        onClose={() => setSelectedGoalForContribution(null)}
        onSubmit={handleAddContributionSubmit}
      />

      {/* Budget Alerts Modal */}
      <BudgetAlertsModal
        visible={isAlertsVisible}
        alerts={alerts}
        unreadCount={unreadAlertsCount}
        onClose={() => setIsAlertsVisible(false)}
        onMarkRead={handleMarkAlertRead}
        onMarkAllRead={handleMarkAllAlertsRead}
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
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    marginTop: 4,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 8,
  },
  tabSegmentText: {
    fontSize: 13,
  },
});
