import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  Repeat,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { CandidateDraft } from '@/types/aiTransaction';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/config/categories';

interface DraftCardProps {
  draft: CandidateDraft;
  index: number;
  totalDrafts: number;
  onChange: (updated: CandidateDraft) => void;
  onRemove: () => void;
}

const PAYMENT_METHODS = [
  { id: 'pm_upi', name: 'UPI' },
  { id: 'pm_cash', name: 'Cash' },
  { id: 'pm_credit_card', name: 'Card' },
  { id: 'pm_bank_transfer', name: 'Bank' },
];

export function DraftCard({
  draft,
  index,
  totalDrafts,
  onChange,
  onRemove,
}: DraftCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const isIncome = draft.type === 'INCOME';
  const availableCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleAmountChange = (text: string) => {
    // Keep numbers and single decimal point
    const sanitized = text.replace(/[^0-9.]/g, '');
    onChange({
      ...draft,
      amount: sanitized,
      needsClarification: sanitized === '' ? true : draft.needsClarification,
    });
  };

  const handleDescriptionChange = (text: string) => {
    onChange({ ...draft, description: text });
  };

  const handleTypeToggle = (newType: 'INCOME' | 'EXPENSE') => {
    Haptics.selectionAsync();
    const newCategories = newType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    onChange({
      ...draft,
      type: newType,
      categoryId: newCategories[0].id,
      categoryName: newCategories[0].name,
    });
  };

  const handleCategorySelect = (catId: string, catName: string) => {
    Haptics.selectionAsync();
    onChange({ ...draft, categoryId: catId, categoryName: catName });
  };

  const handlePaymentMethodSelect = (pmId: string, pmName: string) => {
    Haptics.selectionAsync();
    onChange({
      ...draft,
      paymentMethodId: pmId,
      paymentMethodName: pmName,
    });
  };

  return (
    <Card padding="md" style={styles.card}>
      {/* Top Header: Index & Remove */}
      <View style={styles.headerRow}>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            onPress={() => handleTypeToggle('EXPENSE')}
            style={[
              styles.typeTab,
              !isIncome && {
                backgroundColor: theme.colors.expense,
              },
            ]}
          >
            <Text
              style={[
                styles.typeTabText,
                {
                  color: !isIncome ? '#FFFFFF' : theme.colors.textSecondary,
                  fontFamily: !isIncome
                    ? theme.typography.fontFamily.semiBold
                    : theme.typography.fontFamily.regular,
                },
              ]}
            >
              {t('smartAdd.expense')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeToggle('INCOME')}
            style={[
              styles.typeTab,
              isIncome && {
                backgroundColor: theme.colors.income,
              },
            ]}
          >
            <Text
              style={[
                styles.typeTabText,
                {
                  color: isIncome ? '#FFFFFF' : theme.colors.textSecondary,
                  fontFamily: isIncome
                    ? theme.typography.fontFamily.semiBold
                    : theme.typography.fontFamily.regular,
                },
              ]}
            >
              {t('smartAdd.income')}
            </Text>
          </TouchableOpacity>
        </View>

        {totalDrafts > 1 && (
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onRemove();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.removeBtn}
          >
            <Trash2 size={16} color={theme.colors.expense} />
          </TouchableOpacity>
        )}
      </View>

      {/* Clarification Alert Banner */}
      {draft.needsClarification && draft.clarificationQuestion && (
        <View
          style={[
            styles.clarificationBanner,
            {
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <HelpCircle size={16} color={theme.colors.warning} style={{ marginRight: 6 }} />
          <Text
            style={[
              styles.clarificationText,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {draft.clarificationQuestion}
          </Text>
        </View>
      )}

      {/* Recurring Suggestion Banner */}
      {draft.isRecurringSuggestion && (
        <View
          style={[
            styles.recurringBanner,
            {
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderColor: 'rgba(59, 130, 246, 0.25)',
            },
          ]}
        >
          <Repeat size={14} color={theme.colors.brandPrimary} style={{ marginRight: 6 }} />
          <Text style={[styles.recurringText, { color: theme.colors.textSecondary }]}>
            {t('smartAdd.recurringNotice')}
          </Text>
        </View>
      )}

      {/* Amount & Description Row */}
      <View style={styles.inputGrid}>
        <View style={styles.amountCol}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            {t('smartAdd.amount')}
          </Text>
          <View
            style={[
              styles.amountInputWrapper,
              {
                backgroundColor: theme.colors.background,
                borderColor:
                  !draft.amount || parseFloat(draft.amount) <= 0
                    ? theme.colors.warning
                    : theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: theme.colors.textSecondary }]}>
              ₹
            </Text>
            <TextInput
              value={draft.amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.amountInput,
                {
                  color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.descCol}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            {t('smartAdd.description')}
          </Text>
          <TextInput
            value={draft.description}
            onChangeText={handleDescriptionChange}
            placeholder={t('smartAdd.description')}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.descInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>
      </View>

      {/* Category Picker Chips */}
      <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: 10 }]}>
        {t('smartAdd.category')}
      </Text>
      <View style={styles.categoryScroll}>
        {availableCategories.slice(0, 6).map((cat) => {
          const isSelected = draft.categoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategorySelect(cat.id, cat.name)}
              style={[
                styles.categoryChip,
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
              <CategoryIcon
                iconName={cat.iconName}
                color={isSelected ? '#FFFFFF' : cat.color}
                size="sm"
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                    fontFamily: isSelected
                      ? theme.typography.fontFamily.semiBold
                      : theme.typography.fontFamily.regular,
                  },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment Method Chips */}
      <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: 10 }]}>
        {t('smartAdd.paymentMethod')}
      </Text>
      <View style={styles.pmRow}>
        {PAYMENT_METHODS.map((pm) => {
          const isSelected = draft.paymentMethodId === pm.id;
          return (
            <TouchableOpacity
              key={pm.id}
              onPress={() => handlePaymentMethodSelect(pm.id, pm.name)}
              style={[
                styles.pmChip,
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
                  styles.pmChipText,
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 10,
    padding: 3,
  },
  typeTab: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  typeTabText: {
    fontSize: 12,
  },
  removeBtn: {
    padding: 6,
  },
  clarificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  clarificationText: {
    fontSize: 12,
    flex: 1,
  },
  recurringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  recurringText: {
    fontSize: 11,
    flex: 1,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  amountCol: {
    width: '40%',
  },
  descCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
  },
  descInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  categoryScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
  },
  pmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pmChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pmChipText: {
    fontSize: 11,
  },
});
