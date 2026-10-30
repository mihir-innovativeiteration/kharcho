import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { RecurringOccurrence } from '@/types/recurring';
import { formatINR } from '@/utils/currency';
import { recurringApiClient } from '@/services/api/recurringApi';
import { notificationService } from '@/services/notifications/notificationService';

interface ConfirmPaidModalProps {
  visible: boolean;
  occurrence: RecurringOccurrence | null;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

const PAYMENT_METHODS = [
  { id: 'pm_upi', name: 'UPI' },
  { id: 'pm_bank', name: 'Net Banking' },
  { id: 'pm_card', name: 'Credit / Debit Card' },
  { id: 'pm_cash', name: 'Cash' },
];

export function ConfirmPaidModal({
  visible,
  occurrence,
  onClose,
  onSuccess,
}: ConfirmPaidModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [paymentMethodId, setPaymentMethodId] = useState<string>('pm_upi');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!occurrence) return null;

  const rule = occurrence.rule;
  const isIncome = rule?.type === 'INCOME';
  const amount = rule?.amount || 0;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await recurringApiClient.confirmPaid(occurrence.id, {
        paymentMethodId,
        paidAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      // Cancel scheduled local bill reminder since it is now paid
      void notificationService.cancelBillReminder(occurrence.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {isIncome
                      ? t('recurring.confirmModal.incomeTitle')
                      : t('recurring.confirmModal.title')}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {t('recurring.confirmModal.subtitle')}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.closeBtn, { backgroundColor: theme.colors.background }]}
                >
                  <X size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Amount Highlight Card */}
              <View
                style={[
                  styles.highlightCard,
                  {
                    backgroundColor: isIncome
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)',
                    borderColor: isIncome
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  },
                ]}
              >
                <Text style={[styles.ruleTitle, { color: theme.colors.textPrimary }]}>
                  {rule?.title || 'Scheduled Payment'}
                </Text>
                {rule?.providerName ? (
                  <Text style={[styles.ruleProvider, { color: theme.colors.textMuted }]}>
                    {rule.providerName}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.amountText,
                    {
                      color: isIncome ? theme.colors.income : theme.colors.expense,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                >
                  {formatINR(amount)}
                </Text>
              </View>

              {/* Payment Method Selector */}
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {t('recurring.confirmModal.paymentMethodLabel')}
              </Text>
              <View style={styles.methodsRow}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethodId === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPaymentMethodId(pm.id);
                      }}
                      style={[
                        styles.methodChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.brandPrimary
                            : theme.colors.background,
                          borderColor: isSelected
                            ? theme.colors.brandPrimary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.methodText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                            fontFamily: isSelected
                              ? theme.typography.fontFamily.semiBold
                              : theme.typography.fontFamily.regular,
                          },
                        ]}
                      >
                        {pm.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes Input */}
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {t('recurring.confirmModal.notesLabel')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes or transaction reference"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  },
                ]}
              />

              {error ? (
                <Text style={[styles.errorText, { color: theme.colors.expense }]}>
                  {error}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={loading}
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: isIncome
                        ? theme.colors.income
                        : theme.colors.brandPrimary,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmBtnText}>
                        {t('recurring.confirmModal.submitBtn')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  ruleProvider: {
    fontSize: 12,
    marginBottom: 6,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  methodChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 12,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
