import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { CategoryIcon } from '../ui/CategoryIcon';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Transaction } from '@/types/transaction';
import { formatINR } from '@/utils/currency';
import { formatFriendlyDate, formatTime } from '@/utils/date';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
  showDate?: boolean;
}

export function TransactionRow({
  transaction,
  onPress,
  showDate = false,
}: TransactionRowProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.selection();
    if (onPress) {
      onPress();
    } else {
      router.push(`/transaction/${transaction.id}` as any);
    }
  };

  const isIncome = transaction.type === 'income';
  const category = transaction.category;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${isIncome ? 'Income' : 'Expense'} of ${formatINR(
        transaction.amount
      )} via ${transaction.paymentMethod}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceSubtle : theme.colors.surface,
          borderBottomColor: theme.colors.borderLight,
        },
      ]}
    >
      <CategoryIcon
        iconName={category?.iconName || (isIncome ? 'Coins' : 'ShoppingBag')}
        color={category?.color || (isIncome ? theme.colors.income : theme.colors.brandPrimary)}
        size="md"
        style={styles.icon}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
            numberOfLines={1}
          >
            {transaction.title}
          </Text>

          <Text
            style={[
              styles.amount,
              {
                color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
            numberOfLines={1}
          >
            {isIncome ? `+${formatINR(transaction.amount)}` : `-${formatINR(transaction.amount)}`}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaLeft}>
            <Text
              style={[
                styles.categoryName,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fontFamily.regular,
                },
              ]}
              numberOfLines={1}
            >
              {category?.name || 'General'}
            </Text>
            <View style={[styles.dot, { backgroundColor: theme.colors.borderStrong }]} />
            <Text style={[styles.paymentMethod, { color: theme.colors.textMuted }]}>
              {transaction.paymentMethod}
            </Text>
            {transaction.syncStatus && transaction.syncStatus !== 'SYNCED' && (
              <>
                <View style={[styles.dot, { backgroundColor: theme.colors.borderStrong }]} />
                <View style={styles.syncBadge}>
                  <Clock size={11} color="#d97706" style={{ marginRight: 3 }} />
                  <Text style={styles.syncBadgeText}>
                    {transaction.syncStatus === 'CONFLICT' ? 'Conflict' : 'Pending sync'}
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text
            style={[
              styles.time,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
          >
            {showDate
              ? `${formatFriendlyDate(transaction.date)} · ${formatTime(transaction.date)}`
              : formatTime(transaction.date)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    minHeight: 64,
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  paymentMethod: {
    fontSize: 12,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  syncBadgeText: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
});
