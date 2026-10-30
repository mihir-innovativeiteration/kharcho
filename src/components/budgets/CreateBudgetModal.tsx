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
import { CategoryIcon } from '../ui/CategoryIcon';
import { Button } from '../ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { EXPENSE_CATEGORIES } from '@/constants/config/categories';
import { BudgetType } from '@/types/budget';
import { Bell, PieChart, Wallet, X } from 'lucide-react-native';

interface CreateBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: BudgetType;
    categoryId?: string | null;
    amount: string;
    warningThresholds?: number[];
  }) => Promise<void>;
}

export function CreateBudgetModal({ visible, onClose, onSubmit }: CreateBudgetModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const [budgetType, setBudgetType] = useState<BudgetType>('CATEGORY');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(EXPENSE_CATEGORIES[0]?.id || 'cat_food');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = EXPENSE_CATEGORIES.find((c) => c.id === selectedCategoryId);

  const handleTypeChange = (type: BudgetType) => {
    haptics.selection();
    setBudgetType(type);
    setError(null);
  };

  const handleCategorySelect = (catId: string) => {
    haptics.selection();
    setSelectedCategoryId(catId);
    setError(null);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('budgets.errors.invalidAmount', 'Please enter a valid positive budget amount'));
      haptics.error();
      return;
    }

    const finalName =
      name.trim() ||
      (budgetType === 'OVERALL'
        ? t('budgets.overallBudget', 'Overall Monthly Budget')
        : selectedCategory?.name || 'Category Budget');

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: finalName,
        type: budgetType,
        categoryId: budgetType === 'CATEGORY' ? selectedCategoryId : null,
        amount: numAmount.toFixed(2),
        warningThresholds: [50, 80, 100],
      });
      haptics.success();
      setAmount('');
      setName('');
      onClose();
    } catch (err: any) {
      haptics.error();
      setError(err?.message || t('budgets.errors.failedCreate', 'Failed to create budget. Try again.'));
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
                {t('budgets.createTitle', 'Create New Budget')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {t('budgets.createSubtitle', 'Set proactive spending limits & alerts')}
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
            {/* Scope Switcher */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
              {t('budgets.scopeLabel', 'Budget Type')}
            </Text>
            <View style={[styles.segmentedRow, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <Pressable
                onPress={() => handleTypeChange('CATEGORY')}
                style={[
                  styles.segmentOption,
                  budgetType === 'CATEGORY' && {
                    backgroundColor: theme.colors.surfaceElevated,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                  },
                ]}
              >
                <PieChart
                  size={15}
                  color={budgetType === 'CATEGORY' ? theme.colors.brandAccent : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        budgetType === 'CATEGORY' ? theme.colors.brandAccent : theme.colors.textSecondary,
                      fontFamily:
                        budgetType === 'CATEGORY'
                          ? theme.typography.fontFamily.semiBold
                          : theme.typography.fontFamily.regular,
                    },
                  ]}
                >
                  {t('budgets.byCategory', 'Category Budget')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeChange('OVERALL')}
                style={[
                  styles.segmentOption,
                  budgetType === 'OVERALL' && {
                    backgroundColor: theme.colors.surfaceElevated,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                  },
                ]}
              >
                <Wallet
                  size={15}
                  color={budgetType === 'OVERALL' ? theme.colors.brandAccent : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        budgetType === 'OVERALL' ? theme.colors.brandAccent : theme.colors.textSecondary,
                      fontFamily:
                        budgetType === 'OVERALL'
                          ? theme.typography.fontFamily.semiBold
                          : theme.typography.fontFamily.regular,
                    },
                  ]}
                >
                  {t('budgets.overallScope', 'Overall Monthly')}
                </Text>
              </Pressable>
            </View>

            {/* Category Selector (if Category Budget) */}
            {budgetType === 'CATEGORY' && (
              <View style={styles.sectionMargin}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                  {t('budgets.selectCategory', 'Expense Category')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => handleCategorySelect(cat.id)}
                        style={[
                          styles.catItem,
                          {
                            borderColor: isSelected ? theme.colors.brandAccent : theme.colors.borderLight,
                            backgroundColor: isSelected
                              ? theme.isDark
                                ? '#142E25'
                                : '#ECFDF5'
                              : theme.colors.surfaceSubtle,
                          },
                        ]}
                      >
                        <CategoryIcon iconName={cat.iconName} color={cat.color} size="sm" />
                        <Text
                          style={[
                            styles.catName,
                            {
                              color: isSelected ? theme.colors.brandAccent : theme.colors.textPrimary,
                              fontFamily: isSelected
                                ? theme.typography.fontFamily.semiBold
                                : theme.typography.fontFamily.regular,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('budgets.nameLabel', 'Budget Name (Optional)')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={
                  budgetType === 'OVERALL'
                    ? t('budgets.overallBudget', 'Overall Monthly Budget')
                    : selectedCategory?.name || 'e.g. Zepto & Swiggy'
                }
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

            {/* Amount Limit Input */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('budgets.amountLabel', 'Monthly Spending Limit (₹)')}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="₹ 15,000"
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

            {/* Threshold Notice */}
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: theme.isDark ? '#142E25' : '#ECFDF5',
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <Bell size={16} color={theme.colors.brandAccent} />
              <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
                {t(
                  'budgets.thresholdNotice',
                  'In-app alerts are triggered automatically when spending reaches 50%, 80%, and 100% of this limit.'
                )}
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.expense }]}>{error}</Text>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title={t('common.cancel', 'Cancel')}
                variant="outline"
                onPress={onClose}
                style={styles.cancelBtn}
              />
              <Button
                title={t('budgets.saveBudget', 'Save Budget')}
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
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
  },
  sectionMargin: {
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  catName: {
    fontSize: 13,
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
