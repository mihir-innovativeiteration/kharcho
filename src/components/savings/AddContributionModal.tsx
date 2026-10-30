import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { SavingsGoal } from '@/types/budget';
import { formatINR } from '@/utils/currency';
import { Info, X } from 'lucide-react-native';

interface AddContributionModalProps {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSubmit: (goalId: string, data: { amount: string; note?: string }) => Promise<void>;
}

export function AddContributionModal({
  visible,
  goal,
  onClose,
  onSubmit,
}: AddContributionModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('savings.errors.invalidContribution', 'Please enter a valid positive contribution amount'));
      haptics.error();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(goal.id, {
        amount: numAmount.toFixed(2),
        note: note.trim() || undefined,
      });
      haptics.success();
      setAmount('');
      setNote('');
      onClose();
    } catch (err: any) {
      haptics.error();
      setError(err?.message || t('savings.errors.failedContribute', 'Failed to record contribution'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.colors.surfaceElevated }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.colors.borderLight }]}>
            <View>
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.bold },
                ]}
              >
                {t('savings.recordContribution', 'Add Savings Entry')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.brandAccent }]}>
                {goal.name} • {t('savings.remaining', 'Remaining')}: {formatINR(goal.remainingAmount)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
              accessibilityLabel="Close"
            >
              <X size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Amount */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('savings.contributionAmount', 'Amount Saved (₹)')}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="₹ 5,000"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  styles.amountInput,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.bold,
                  },
                ]}
              />
            </View>

            {/* Note */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('savings.noteLabel', 'Note / Source (Optional)')}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Monthly SIP transfer, Cash deposited"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Disclaimer */}
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: theme.isDark ? '#142E25' : '#ECFDF5',
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <Info size={16} color={theme.colors.brandAccent} />
              <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
                {t(
                  'savings.disclaimerText',
                  'Contributions are manual tracking entries, not real transfers of money.'
                )}
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.expense }]}>{error}</Text>
            )}

            {/* Buttons */}
            <View style={styles.actionRow}>
              <Button
                title={t('common.cancel', 'Cancel')}
                variant="outline"
                onPress={onClose}
                style={styles.cancelBtn}
              />
              <Button
                title={t('savings.confirmContribution', 'Record Entry')}
                variant="primary"
                onPress={handleSubmit}
                loading={isSubmitting}
                style={styles.submitBtn}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionMargin: {
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  amountInput: {
    fontSize: 20,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 1,
  },
});
