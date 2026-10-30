import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { LoadingState } from '@/components/ui/LoadingState';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { transactionService } from '@/services/api';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Transaction } from '@/types/transaction';
import { formatINR } from '@/utils/currency';
import { formatFriendlyDate, formatTime } from '@/utils/date';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hash,
  Trash2,
} from 'lucide-react-native';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  const { deleteTransaction } = useApp();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await transactionService.getTransactionById(id);
        setTransaction(res.data);
      } catch (e) {
        console.warn('Error fetching transaction detail:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!transaction) return;
    haptics.warning();
    await deleteTransaction(transaction.id);
    setDeleteModalVisible(false);
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Loading transaction receipt..." />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title="Not Found" showBack />
        <View style={styles.notFoundCenter}>
          <Text style={{ color: theme.colors.textSecondary }}>
            This transaction record could not be found.
          </Text>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const category = transaction.category;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Transaction Details"
        showBack
        rightElement={
          <Button
            title=""
            onPress={() => setDeleteModalVisible(true)}
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={18} color={theme.colors.expense} />}
            accessibilityLabel="Delete transaction"
          />
        }
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 8 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Main Card */}
        <Card padding="xl" style={styles.receiptCard}>
          <View style={styles.topReceiptSection}>
            <CategoryIcon
              iconName={category?.iconName || (isIncome ? 'Coins' : 'ShoppingBag')}
              color={category?.color || theme.colors.brandPrimary}
              size="lg"
              style={styles.categoryIcon}
            />

            <Text
              style={[
                styles.amountDisplay,
                {
                  color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              {isIncome ? `+${formatINR(transaction.amount)}` : `-${formatINR(transaction.amount)}`}
            </Text>

            <Text
              style={[
                styles.titleDisplay,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.semiBold,
                },
              ]}
            >
              {transaction.title}
            </Text>

            <View style={styles.statusBadgeRow}>
              <Badge
                label={isIncome ? 'Income Credited' : 'Expense Recorded'}
                variant={isIncome ? 'success' : 'neutral'}
                icon={<CheckCircle2 size={12} color={isIncome ? theme.colors.income : theme.colors.textSecondary} />}
              />
            </View>
          </View>

          {/* Dotted Receipt Divider */}
          <View style={[styles.dottedDivider, { borderColor: theme.colors.border }]} />

          {/* Receipt Meta Rows */}
          <View style={styles.metaSection}>
            {/* Category */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                Category
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {category?.name || 'General'}
              </Text>
            </View>

            {/* Payment Method */}
            <View style={styles.metaRow}>
              <View style={styles.labelWithIcon}>
                <CreditCard size={14} color={theme.colors.textMuted} />
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                  Payment Mode
                </Text>
              </View>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {transaction.paymentMethod}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.metaRow}>
              <View style={styles.labelWithIcon}>
                <Calendar size={14} color={theme.colors.textMuted} />
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                  Date
                </Text>
              </View>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {formatFriendlyDate(transaction.date)}
              </Text>
            </View>

            {/* Time */}
            <View style={styles.metaRow}>
              <View style={styles.labelWithIcon}>
                <Clock size={14} color={theme.colors.textMuted} />
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                  Time
                </Text>
              </View>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {formatTime(transaction.date)}
              </Text>
            </View>

            {/* Transaction Reference ID */}
            <View style={styles.metaRow}>
              <View style={styles.labelWithIcon}>
                <Hash size={14} color={theme.colors.textMuted} />
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                  Reference
                </Text>
              </View>
              <Text
                style={[
                  styles.referenceId,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                ]}
              >
                {transaction.id}
              </Text>
            </View>

            {/* Optional Note */}
            {transaction.note && (
              <View style={styles.noteSection}>
                <View style={styles.labelWithIcon}>
                  <FileText size={14} color={theme.colors.textMuted} />
                  <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                    Remarks & Note
                  </Text>
                </View>
                <Text
                  style={[
                    styles.noteText,
                    {
                      color: theme.colors.textSecondary,
                      backgroundColor: theme.colors.surfaceSubtle,
                    },
                  ]}
                >
                  {transaction.note}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Delete Action Button */}
        <Button
          title="Delete Transaction"
          onPress={() => setDeleteModalVisible(true)}
          variant="outline"
          size="md"
          leftIcon={<Trash2 size={16} color={theme.colors.expense} />}
          textStyle={{ color: theme.colors.expense }}
          style={styles.deleteButton}
        />
      </ScrollView>

      {/* Confirmation Dialog */}
      <ModalDialog
        visible={deleteModalVisible}
        title={t('transactions.deleteConfirmTitle')}
        description={t('transactions.deleteConfirmDesc')}
        confirmText={t('transactions.delete')}
        cancelText={t('common.cancel')}
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
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
    paddingTop: 12,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  receiptCard: {
    marginBottom: 20,
  },
  topReceiptSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryIcon: {
    marginBottom: 16,
  },
  amountDisplay: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  titleDisplay: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBadgeRow: {
    marginTop: 4,
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    marginVertical: 20,
  },
  metaSection: {
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  referenceId: {
    fontSize: 12,
  },
  noteSection: {
    marginTop: 4,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  deleteButton: {
    borderColor: '#FECDD3',
  },
});
