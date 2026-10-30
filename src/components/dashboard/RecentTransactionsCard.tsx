import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Transaction } from '@/types/transaction';
import { formatINR } from '@/utils/currency';
import { formatFriendlyDate } from '@/utils/date';
import { ArrowRight, Clock, Plus } from 'lucide-react-native';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
}

export function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const haptics = useHaptics();

  return (
    <Card padding="lg" style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Clock size={16} color={theme.colors.brandAccent} strokeWidth={2.4} />
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.semiBold,
              },
            ]}
          >
            {t('dashboard.recentTransactions', 'Recent Transactions')}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            haptics.selection();
            router.push('/(tabs)/activity');
          }}
          style={styles.viewAllButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.viewAll', 'View All Transactions')}
        >
          <Text style={[styles.viewAllText, { color: theme.colors.brandAccent }]}>
            {t('dashboard.viewAll', 'View All')}
          </Text>
          <ArrowRight size={14} color={theme.colors.brandAccent} />
        </Pressable>
      </View>

      {/* Transaction List or Empty State */}
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            {t('transactions.emptyTransactions', 'No transactions yet')}
          </Text>
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/transaction/new');
            }}
            style={[
              styles.addFirstBtn,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Plus size={14} color={theme.colors.brandAccent} />
            <Text style={[styles.addFirstText, { color: theme.colors.brandAccent }]}>
              {t('transactions.newTransaction', 'Add Transaction')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {transactions.map((tx, index) => {
            const isIncome = tx.type === 'income';
            const categoryColor = tx.category?.color || (isIncome ? '#10B981' : '#F97316');
            const isLast = index === transactions.length - 1;

            return (
              <Pressable
                key={tx.id}
                onPress={() => {
                  haptics.selection();
                  router.push(`/transaction/${tx.id}`);
                }}
                style={({ pressed }) => [
                  styles.transactionItem,
                  !isLast && { borderBottomColor: theme.colors.borderLight, borderBottomWidth: 1 },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${tx.title}, ${formatINR(tx.amount)}`}
              >
                <CategoryIcon
                  iconName={tx.category?.iconName || (isIncome ? 'Coins' : 'ShoppingBag')}
                  color={categoryColor}
                  size="md"
                />

                <View style={styles.infoColumn}>
                  <Text
                    style={[
                      styles.descriptionText,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fontFamily.semiBold,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tx.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.categoryName, { color: theme.colors.textMuted }]}>
                      {tx.category?.name || 'General'}
                    </Text>
                    <Text style={[styles.dotSeparator, { color: theme.colors.textMuted }]}>•</Text>
                    <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                      {formatFriendlyDate(tx.date)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.amountText,
                    {
                      color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {isIncome ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  addFirstText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    minHeight: 52,
  },
  infoColumn: {
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 11,
  },
  dotSeparator: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  dateText: {
    fontSize: 11,
  },
  amountText: {
    fontSize: 14,
    textAlign: 'right',
  },
});
