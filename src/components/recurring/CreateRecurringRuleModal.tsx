import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { CreateRecurringRuleInput, RecurringFrequency } from '@/types/recurring';
import { recurringApiClient } from '@/services/api/recurringApi';

interface CreateRecurringRuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (rule: any) => void;
}

const FREQUENCIES: { id: RecurringFrequency; labelKey: string }[] = [
  { id: 'DAILY', labelKey: 'recurring.frequency.DAILY' },
  { id: 'WEEKLY', labelKey: 'recurring.frequency.WEEKLY' },
  { id: 'MONTHLY', labelKey: 'recurring.frequency.MONTHLY' },
  { id: 'YEARLY', labelKey: 'recurring.frequency.YEARLY' },
];

const REMINDER_OPTIONS = [
  { days: 0, label: 'On due date' },
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '7 days before' },
];

export function CreateRecurringRuleModal({
  visible,
  onClose,
  onSuccess,
}: CreateRecurringRuleModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [title, setTitle] = useState('');
  const [providerName, setProviderName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [autoPost, setAutoPost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setProviderName('');
    setAmount('');
    setType('EXPENSE');
    setFrequency('MONTHLY');
    setReminderDays(3);
    setAutoPost(false);
    setError(null);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(t('validation.titleRequired', { defaultValue: 'Please enter a title' }));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('validation.invalidAmount', { defaultValue: 'Please enter a valid positive amount' }));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Default start date to today
      const startDate = new Date().toISOString();

      const payload: CreateRecurringRuleInput = {
        title: title.trim(),
        providerName: providerName.trim() || undefined,
        type,
        amount: parsedAmount,
        currency: 'INR',
        frequency,
        interval: 1,
        startDate,
        reminderEnabled: true,
        reminderDaysBefore: reminderDays,
        autoPost,
      };

      const result = await recurringApiClient.createRule(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(result);
      resetForm();
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.message || 'Failed to create recurring rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
                    {t('recurring.createRule')}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {t('recurring.subtitle')}
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

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                {/* Type Selector (Expense vs Income) */}
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType('EXPENSE');
                    }}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor:
                          type === 'EXPENSE'
                            ? theme.colors.expense
                            : theme.colors.background,
                        borderColor:
                          type === 'EXPENSE'
                            ? theme.colors.expense
                            : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        {
                          color: type === 'EXPENSE' ? '#FFFFFF' : theme.colors.textSecondary,
                          fontFamily:
                            type === 'EXPENSE'
                              ? theme.typography.fontFamily.semiBold
                              : theme.typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {t('recurring.fields.expense')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType('INCOME');
                    }}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor:
                          type === 'INCOME'
                            ? theme.colors.income
                            : theme.colors.background,
                        borderColor:
                          type === 'INCOME'
                            ? theme.colors.income
                            : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        {
                          color: type === 'INCOME' ? '#FFFFFF' : theme.colors.textSecondary,
                          fontFamily:
                            type === 'INCOME'
                              ? theme.typography.fontFamily.semiBold
                              : theme.typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {t('recurring.fields.income')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Title */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('recurring.fields.titleLabel')}
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('recurring.fields.titlePlaceholder')}
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

                {/* Provider / Biller */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('recurring.fields.providerLabel')}
                </Text>
                <TextInput
                  value={providerName}
                  onChangeText={setProviderName}
                  placeholder={t('recurring.fields.providerPlaceholder')}
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

                {/* Amount */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('recurring.fields.amountLabel')}
                </Text>
                <View
                  style={[
                    styles.amountContainer,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencySymbol,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    ₹
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.amountInput,
                      { color: theme.colors.textPrimary },
                    ]}
                  />
                </View>

                {/* Frequency */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('recurring.fields.frequencyLabel')}
                </Text>
                <View style={styles.frequencyRow}>
                  {FREQUENCIES.map((freq) => {
                    const isSelected = frequency === freq.id;
                    return (
                      <TouchableOpacity
                        key={freq.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setFrequency(freq.id);
                        }}
                        style={[
                          styles.freqChip,
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
                            styles.freqText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                              fontFamily: isSelected
                                ? theme.typography.fontFamily.semiBold
                                : theme.typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {t(freq.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Reminder Lead Time */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('recurring.fields.reminderDaysLabel')}
                </Text>
                <View style={styles.frequencyRow}>
                  {REMINDER_OPTIONS.map((opt) => {
                    const isSelected = reminderDays === opt.days;
                    return (
                      <TouchableOpacity
                        key={opt.days}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setReminderDays(opt.days);
                        }}
                        style={[
                          styles.freqChip,
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
                            styles.freqText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                              fontFamily: isSelected
                                ? theme.typography.fontFamily.semiBold
                                : theme.typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Auto-Post Switch */}
                <View
                  style={[
                    styles.switchCard,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                      style={[
                        styles.switchTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {t('recurring.fields.autoPostLabel')}
                    </Text>
                    <Text
                      style={[
                        styles.switchSubtitle,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {t('recurring.fields.autoPostHint')}
                    </Text>
                  </View>
                  <Switch
                    value={autoPost}
                    onValueChange={(val) => {
                      Haptics.selectionAsync();
                      setAutoPost(val);
                    }}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.brandPrimary,
                    }}
                  />
                </View>

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
                    onPress={handleCreate}
                    disabled={loading}
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor:
                          type === 'INCOME'
                            ? theme.colors.income
                            : theme.colors.brandPrimary,
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {t('recurring.createRule')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
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
    fontSize: 20,
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
  scroll: {
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  amountContainer: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  freqChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  freqText: {
    fontSize: 12,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 11,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
