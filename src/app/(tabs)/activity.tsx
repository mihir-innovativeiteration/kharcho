import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SyncStatusBar } from '@/components/ui/SyncStatusBar';
import { ALL_CATEGORIES } from '@/constants/config/categories';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Transaction, TransactionGroup } from '@/types/transaction';
import { formatFriendlyDate } from '@/utils/date';
import { Plus, Search, X } from 'lucide-react-native';

export default function ActivityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  const {
    transactions,
    isTransactionsLoading,
    transactionsError,
    refreshTransactions,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      void refreshTransactions();
    }, [refreshTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (typeFilter !== 'all') {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    if (selectedCategoryId !== 'all') {
      result = result.filter((tx) => tx.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (tx) =>
          tx.title.toLowerCase().includes(q) ||
          tx.note?.toLowerCase().includes(q) ||
          tx.category?.name.toLowerCase().includes(q) ||
          tx.paymentMethod.toLowerCase().includes(q)
      );
    }

    return result;
  }, [transactions, typeFilter, selectedCategoryId, searchQuery]);

  // Group transactions by date
  const groupedTransactions: TransactionGroup[] = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    const sortedKeys = Object.keys(groups).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedKeys.map((dateKey) => {
      const items = groups[dateKey];
      const totalExpense = items
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = items
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        dateTitle: formatFriendlyDate(dateKey),
        formattedDate: dateKey,
        totalExpense,
        totalIncome,
        transactions: items,
      };
    });
  }, [filteredTransactions]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSelectedCategoryId('all');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader
          title={t('transactions.title')}
          subtitle="All transactions and history"
          rightElement={
            <IconButton
              icon={<Plus size={20} color="#FFFFFF" strokeWidth={2.5} />}
              onPress={() => router.push('/transaction/new' as any)}
              variant="brand"
              size="md"
              accessibilityLabel="Add transaction"
            />
          }
        />

        {/* Offline & Sync Status Banner */}
        <SyncStatusBar />

        {/* Search Bar */}
        <Input
          placeholder={t('transactions.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftElement={<Search size={18} color={theme.colors.textMuted} />}
          rightElement={
            searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={theme.colors.textMuted} />
              </Pressable>
            ) : undefined
          }
          containerStyle={styles.searchInputContainer}
        />

        {/* Type Filter Segmented Control */}
        <SegmentedControl
          options={[
            { value: 'all', label: t('transactions.all') },
            { value: 'expense', label: t('transactions.expense') },
            { value: 'income', label: t('transactions.income') },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
          style={styles.segmentedControl}
        />

        {/* Horizontal Category Pill Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          <Pressable
            onPress={() => {
              haptics.selection();
              setSelectedCategoryId('all');
            }}
            style={[
              styles.categoryPill,
              {
                backgroundColor:
                  selectedCategoryId === 'all'
                    ? theme.isDark
                      ? theme.colors.brandAccent
                      : theme.colors.brandPrimary
                    : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                {
                  color:
                    selectedCategoryId === 'all'
                      ? '#FFFFFF'
                      : theme.colors.textSecondary,
                  fontWeight: selectedCategoryId === 'all' ? '700' : '500',
                },
              ]}
            >
              All Categories
            </Text>
          </Pressable>

          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  haptics.selection();
                  setSelectedCategoryId(cat.id);
                }}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected
                      ? theme.isDark
                        ? theme.colors.brandAccent
                        : theme.colors.brandPrimary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      {isTransactionsLoading && !refreshing ? (
        <LoadingState message="Fetching transaction history..." />
      ) : transactionsError ? (
        <ErrorState message={transactionsError} onRetry={refreshTransactions} />
      ) : groupedTransactions.length === 0 ? (
        <EmptyState
          title={searchQuery || typeFilter !== 'all' || selectedCategoryId !== 'all' ? 'No Matching Records' : 'No Activity Recorded'}
          description={
            searchQuery || typeFilter !== 'all' || selectedCategoryId !== 'all'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Add your first income or expense to start tracking financial activity.'
          }
          actionTitle={
            searchQuery || typeFilter !== 'all' || selectedCategoryId !== 'all'
              ? 'Clear Filters'
              : 'Add Transaction'
          }
          onAction={
            searchQuery || typeFilter !== 'all' || selectedCategoryId !== 'all'
              ? handleClearFilters
              : () => router.push('/transaction/new' as any)
          }
        />
      ) : (
        <FlatList
          data={groupedTransactions}
          keyExtractor={(item) => item.formattedDate}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brandAccent}
              colors={[theme.colors.brandAccent]}
            />
          }
          renderItem={({ item: group }) => (
            <View style={styles.groupContainer}>
              {/* Group Date Header */}
              <View style={styles.groupHeaderRow}>
                <Text
                  style={[
                    styles.groupDateTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.semiBold,
                    },
                  ]}
                >
                  {group.dateTitle}
                </Text>

                <Text style={[styles.groupSubtitle, { color: theme.colors.textMuted }]}>
                  {group.transactions.length}{' '}
                  {group.transactions.length === 1 ? 'item' : 'items'}
                </Text>
              </View>

              {/* Transactions in this date */}
              <View
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {group.transactions.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: 8,
  },
  searchInputContainer: {
    marginBottom: 10,
  },
  segmentedControl: {
    marginBottom: 10,
  },
  categoryPillsScroll: {
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupDateTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupSubtitle: {
    fontSize: 12,
  },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
