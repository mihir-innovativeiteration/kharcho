import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SyncStatusBar } from '@/components/ui/SyncStatusBar';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/constants/config/categories';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { PaymentMethod } from '@/types/transaction';
import { sanitizeCurrencyInput } from '@/utils/currency';
import { Check, Sparkles, X } from 'lucide-react-native';

export default function NewTransactionScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ type?: string }>();

  const { addTransaction } = useApp();

  const [type, setType] = useState<'expense' | 'income'>(
    params.type === 'income' ? 'income' : 'expense'
  );
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    type === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; title?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availableCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setSelectedCategoryId(
      newType === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id
    );
  };

  const handleAmountChange = (text: string) => {
    const cleaned = sanitizeCurrencyInput(text);
    setAmount(cleaned);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleSave = async () => {
    if (loading) return; // Prevent repeated submissions
    setSubmitError(null);

    const numAmount = parseFloat(amount);
    const newErrors: { amount?: string; title?: string } = {};

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!title.trim()) {
      newErrors.title = 'Please enter a description or merchant name';
    }

    if (Object.keys(newErrors).length > 0) {
      haptics.error();
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        title: title.trim(),
        amount: numAmount,
        type,
        categoryId: selectedCategoryId,
        date: new Date().toISOString(),
        paymentMethod,
        note: note.trim() || undefined,
      });

      haptics.success();
      router.back();
    } catch (e: any) {
      haptics.error();
      setSubmitError(e?.message || 'Unable to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Modal Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon={<X size={20} color={theme.colors.textPrimary} />}
          onPress={() => router.back()}
          variant="ghost"
          size="md"
          accessibilityLabel="Close form"
        />

        <Text
          style={[
            styles.modalTitle,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.bold,
            },
          ]}
        >
          {type === 'expense'
            ? `${t('transactions.newTransaction')} (${t('transactions.expense')})`
            : `${t('transactions.newTransaction')} (${t('transactions.income')})`}
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Offline Status */}
        <SyncStatusBar />

        {/* Type Selector */}
        {submitError ? (
          <View style={[styles.submitErrorCard, { backgroundColor: `${theme.colors.expense}15` }]}>
            <Text style={[styles.submitErrorText, { color: theme.colors.expense }]}>
              {submitError}
            </Text>
          </View>
        ) : null}

        {/* AI Smart Add Banner */}
        <Pressable
          onPress={() => {
            haptics.selection();
            router.push('/transaction/smart-add' as any);
          }}
          style={[
            styles.smartAddBanner,
            {
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderColor: 'rgba(59, 130, 246, 0.25)',
            },
          ]}
        >
          <Sparkles size={16} color={theme.colors.brandPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.smartAddBannerText, { color: theme.colors.textPrimary }]}>
            Type naturally in Hinglish, ગુજરાતી, or हिंदी?{' '}
            <Text style={{ color: theme.colors.brandPrimary, fontWeight: '600' }}>
              Try AI Smart Add →
            </Text>
          </Text>
        </Pressable>

        <SegmentedControl
          options={[
            { value: 'expense', label: `${t('transactions.expense')} (-)` },
            { value: 'income', label: `${t('transactions.income')} (+)` },
          ]}
          value={type}
          onChange={handleTypeChange}
          style={styles.typeSelector}
        />

        {/* Big Amount Input */}
        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.amount
                ? theme.colors.expense
                : theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.currencySymbol, { color: theme.colors.brandAccent }]}>
            ₹
          </Text>
          <Input
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0"
            keyboardType="numeric"
            autoFocus
            style={styles.amountInput}
            containerStyle={styles.amountInputContainer}
            placeholderTextColor={theme.colors.textMuted}
            error={errors.amount}
          />
        </View>

        {/* Title / Merchant */}
        <Input
          label="Title or Merchant"
          placeholder="e.g. Swiggy, Zara, Salary credit..."
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          error={errors.title}
        />

        {/* Category Picker */}
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.medium,
            },
          ]}
        >
          Select Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {availableCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  haptics.selection();
                  setSelectedCategoryId(cat.id);
                }}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: isSelected
                      ? theme.isDark
                        ? '#17362B'
                        : '#ECFDF5'
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.brandAccent
                      : theme.colors.border,
                  },
                ]}
              >
                <CategoryIcon
                  iconName={cat.iconName}
                  color={isSelected ? theme.colors.brandAccent : cat.color}
                  size="sm"
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: isSelected
                        ? theme.colors.brandAccent
                        : theme.colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
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

        {/* Payment Method Selector */}
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.medium,
            },
          ]}
        >
          Payment Method
        </Text>
        <View style={styles.paymentMethodsRow}>
          {(['UPI', 'Card', 'Net Banking', 'Cash'] as PaymentMethod[]).map((method) => {
            const isSelected = paymentMethod === method;
            return (
              <Pressable
                key={method}
                onPress={() => {
                  haptics.selection();
                  setPaymentMethod(method);
                }}
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.brandPrimary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentOptionText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {method}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Note / Remarks */}
        <Input
          label="Optional Note"
          placeholder="e.g. Lunch with team, festival discount..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
          containerStyle={styles.noteInputContainer}
        />

        {/* Save Action Button */}
        <Button
          title={loading ? t('common.loading') : t('transactions.saveTransaction')}
          onPress={handleSave}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Check size={18} color="#FFFFFF" strokeWidth={2.5} />}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  submitErrorCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitErrorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  typeSelector: {
    marginBottom: 16,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  categoriesScroll: {
    gap: 8,
    paddingBottom: 16,
    flexDirection: 'row',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  categoryOptionText: {
    fontSize: 13,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentOptionText: {
    fontSize: 12,
  },
  noteInputContainer: {
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 8,
  },
  smartAddBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  smartAddBannerText: {
    fontSize: 13,
    flex: 1,
  },
});
