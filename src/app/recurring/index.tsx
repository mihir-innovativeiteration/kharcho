import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FastForward,
  Info,
  Plus,
  Repeat,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { RecurringEstimates, RecurringOccurrence, RecurringRule } from '@/types/recurring';
import { recurringApiClient } from '@/services/api/recurringApi';
import { formatINR } from '@/utils/currency';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ConfirmPaidModal } from '@/components/recurring/ConfirmPaidModal';
import { CreateRecurringRuleModal } from '@/components/recurring/CreateRecurringRuleModal';
import { RecurringRuleCard } from '@/components/recurring/RecurringRuleCard';

export default function RecurringScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ALL'>('UPCOMING');
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [occurrences, setOccurrences] = useState<RecurringOccurrence[]>([]);
  const [estimates, setEstimates] = useState<RecurringEstimates>({
    monthlyExpenses: 0,
    monthlyIncome: 0,
    monthlyNet: 0,
    currency: 'INR',
    notice: '',
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<RecurringOccurrence | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, occRes] = await Promise.all([
        recurringApiClient.getRules(),
        recurringApiClient.getUpcomingOccurrences(30),
      ]);

      setRules(rulesRes.items);
      setEstimates(rulesRes.estimates);
      setOccurrences(occRes);
    } catch (err) {
      console.warn('Failed to load recurring data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        void fetchData();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePauseToggle = async (rule: RecurringRule) => {
    try {
      if (rule.status === 'PAUSED') {
        await recurringApiClient.resumeRule(rule.id);
      } else {
        await recurringApiClient.pauseRule(rule.id);
      }
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update schedule status');
    }
  };

  const handleDeleteRule = (rule: RecurringRule) => {
    Alert.alert(
      t('recurring.deleteRule'),
      `Are you sure you want to delete "${rule.title}" and cancel all future scheduled bills?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('recurring.deleteRule'),
          style: 'destructive',
          onPress: async () => {
            try {
              await recurringApiClient.deleteRule(rule.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const handleSkipOccurrence = async (occ: RecurringOccurrence) => {
    Alert.alert(
      t('recurring.skipOccurrence'),
      `Skip this occurrence of "${occ.rule?.title || 'Bill'}"? The next due date will advance automatically without creating any transaction.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('recurring.skipOccurrence'),
          onPress: async () => {
            try {
              await recurringApiClient.skipOccurrence(occ.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to skip bill');
            }
          },
        },
      ]
    );
  };

  const handleOpenConfirmPaid = (occ: RecurringOccurrence) => {
    setSelectedOccurrence(occ);
    setConfirmModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.cardBackground,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {t('recurring.title')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setCreateModalVisible(true);
          }}
          style={[styles.addBtn, { backgroundColor: theme.colors.brandPrimary }]}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brandPrimary}
          />
        }
      >
        {/* Estimated Monthly Impact Cards */}
        <View style={styles.summaryGrid}>
          <Card padding="md" style={styles.summaryCard}>
            <View style={styles.summaryCardTop}>
              <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <TrendingDown size={16} color={theme.colors.expense} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                {t('recurring.projectedExpense')}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                {
                  color: theme.colors.expense,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              {formatINR(estimates.monthlyExpenses)}
            </Text>
          </Card>

          <Card padding="md" style={styles.summaryCard}>
            <View style={styles.summaryCardTop}>
              <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <TrendingUp size={16} color={theme.colors.income} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                {t('recurring.projectedIncome')}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                {
                  color: theme.colors.income,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              {formatINR(estimates.monthlyIncome)}
            </Text>
          </Card>
        </View>

        {/* Disclaimer Notice Pill */}
        <View
          style={[
            styles.disclaimerPill,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Info size={15} color={theme.colors.brandPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.disclaimerText, { color: theme.colors.textSecondary }]}>
            {t('recurring.disclaimer')}
          </Text>
        </View>

        {/* Tabs: Upcoming & Due vs All Schedules */}
        <View
          style={[
            styles.tabsContainer,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('UPCOMING');
            }}
            style={[
              styles.tabBtn,
              activeTab === 'UPCOMING' && {
                backgroundColor: theme.colors.brandPrimary,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'UPCOMING' ? '#FFFFFF' : theme.colors.textSecondary,
                  fontFamily:
                    activeTab === 'UPCOMING'
                      ? theme.typography.fontFamily.semiBold
                      : theme.typography.fontFamily.medium,
                },
              ]}
            >
              {t('recurring.upcomingTitle')} ({occurrences.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('ALL');
            }}
            style={[
              styles.tabBtn,
              activeTab === 'ALL' && {
                backgroundColor: theme.colors.brandPrimary,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'ALL' ? '#FFFFFF' : theme.colors.textSecondary,
                  fontFamily:
                    activeTab === 'ALL'
                      ? theme.typography.fontFamily.semiBold
                      : theme.typography.fontFamily.medium,
                },
              ]}
            >
              {t('recurring.allRules')} ({rules.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={theme.colors.brandPrimary} />
            <Text style={[styles.loadingLabel, { color: theme.colors.textMuted }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : null}

        {/* TAB 1: Upcoming & Due */}
        {activeTab === 'UPCOMING' && !loading && (
          <View style={styles.tabSection}>
            {occurrences.length === 0 ? (
              <Card padding="lg" style={styles.emptyCard}>
                <ShieldCheck size={36} color={theme.colors.income} style={{ marginBottom: 10 }} />
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                >
                  All caught up!
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                  No bills or payments scheduled in the next 30 days.
                </Text>
              </Card>
            ) : (
              occurrences.map((occ) => {
                const rule = occ.rule;
                const isIncome = rule?.type === 'INCOME';
                const scheduled = new Date(occ.scheduledAt);
                const now = new Date();
                const diffDays = Math.ceil(
                  (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                let dueLabel = '';
                let dueColor = theme.colors.textMuted;
                if (diffDays <= 0) {
                  dueLabel = t('recurring.dueToday');
                  dueColor = theme.colors.expense;
                } else if (diffDays === 1) {
                  dueLabel = 'Due tomorrow';
                  dueColor = theme.colors.warning;
                } else {
                  dueLabel = t('recurring.dueInDays', { count: diffDays });
                  dueColor = theme.colors.textSecondary;
                }

                return (
                  <Card key={occ.id} padding="md" style={styles.occCard}>
                    <View style={styles.occTopRow}>
                      <View style={styles.occLeft}>
                        <CategoryIcon
                          iconName={rule?.category?.iconName || rule?.category?.icon || (isIncome ? 'Briefcase' : 'Tag')}
                          color={
                            rule?.category?.color ||
                            (isIncome ? theme.colors.income : theme.colors.brandPrimary)
                          }
                          size="md"
                          style={styles.occIcon}
                        />

                        <View style={styles.occMeta}>
                          <Text
                            style={[
                              styles.occRuleTitle,
                              {
                                color: theme.colors.textPrimary,
                                fontFamily: theme.typography.fontFamily.semiBold,
                              },
                            ]}
                          >
                            {rule?.title || 'Bill'}
                          </Text>
                          <View style={styles.occDueRow}>
                            <Clock size={12} color={dueColor} style={{ marginRight: 4 }} />
                            <Text
                              style={[
                                styles.occDueText,
                                {
                                  color: dueColor,
                                  fontFamily: theme.typography.fontFamily.medium,
                                },
                              ]}
                            >
                              {dueLabel}
                            </Text>
                            {rule?.providerName ? (
                              <Text style={[styles.occProvider, { color: theme.colors.textMuted }]}>
                                • {rule.providerName}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.occAmountText,
                          {
                            color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                            fontFamily: theme.typography.fontFamily.bold,
                          },
                        ]}
                      >
                        {formatINR(rule?.amount || 0)}
                      </Text>
                    </View>

                    {/* Occurrence Actions */}
                    <View
                      style={[
                        styles.occActionsRow,
                        { borderTopColor: theme.colors.border },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleSkipOccurrence(occ)}
                        style={[styles.occSkipBtn, { borderColor: theme.colors.border }]}
                      >
                        <FastForward size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[styles.occSkipText, { color: theme.colors.textMuted }]}>
                          {t('recurring.skipOccurrence')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleOpenConfirmPaid(occ)}
                        style={[
                          styles.occConfirmBtn,
                          {
                            backgroundColor: isIncome
                              ? theme.colors.income
                              : theme.colors.brandPrimary,
                          },
                        ]}
                      >
                        <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.occConfirmText}>
                          {isIncome
                            ? t('recurring.confirmReceived')
                            : t('recurring.confirmPaid')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: All Schedules */}
        {activeTab === 'ALL' && !loading && (
          <View style={styles.tabSection}>
            {rules.length === 0 ? (
              <Card padding="lg" style={styles.emptyCard}>
                <Repeat size={36} color={theme.colors.brandPrimary} style={{ marginBottom: 10 }} />
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                >
                  {t('recurring.emptyState.title')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                  {t('recurring.emptyState.subtitle')}
                </Text>
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  style={[styles.emptyAddBtn, { backgroundColor: theme.colors.brandPrimary }]}
                >
                  <Text style={styles.emptyAddBtnText}>
                    {t('recurring.emptyState.btn')}
                  </Text>
                </TouchableOpacity>
              </Card>
            ) : (
              rules.map((rule) => (
                <RecurringRuleCard
                  key={rule.id}
                  rule={rule}
                  onPauseToggle={handlePauseToggle}
                  onDelete={handleDeleteRule}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <CreateRecurringRuleModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => fetchData()}
      />

      {/* Confirm Paid Modal */}
      <ConfirmPaidModal
        visible={confirmModalVisible}
        occurrence={selectedOccurrence}
        onClose={() => {
          setConfirmModalVisible(false);
          setSelectedOccurrence(null);
        }}
        onSuccess={() => fetchData()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
  },
  disclaimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  loadingWrapper: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingLabel: {
    fontSize: 12,
  },
  tabSection: {
    gap: 10,
  },
  emptyCard: {
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  emptyAddBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  occCard: {
    borderRadius: 16,
  },
  occTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  occLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  occIcon: {
    marginRight: 10,
  },
  occMeta: {
    flex: 1,
  },
  occRuleTitle: {
    fontSize: 15,
    marginBottom: 3,
  },
  occDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occDueText: {
    fontSize: 12,
  },
  occProvider: {
    fontSize: 11,
    marginLeft: 4,
  },
  occAmountText: {
    fontSize: 16,
  },
  occActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  occSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  occSkipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  occConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  occConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
