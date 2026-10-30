import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { CandidateDraft, ConfirmedDraftItem } from '@/types/aiTransaction';
import { aiTransactionApiClient } from '@/services/api/aiTransactionApi';
import { formatINR } from '@/utils/currency';
import { Card } from '@/components/ui/Card';
import { DraftCard } from '@/components/ai/DraftCard';

const EXAMPLE_PROMPTS = [
  'Aaje 250 nu petrol ane 120 ni coffee UPI thi',
  'આજે પેટ્રોલના ૫૦૦ રૂપિયા UPI થી ચૂકવ્યા',
  'आज ₹200 का खाना UPI से',
  'Spent ₹500 on groceries yesterday',
  'Salary received 45000 today in bank',
  'Netflix 649 monthly subscription',
];

export default function SmartAddScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    refreshTransactions,
    refreshBudgets,
    refreshDashboard,
    refreshInsights,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [drafts, setDrafts] = useState<CandidateDraft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle parsing natural language input
  const handleParse = async (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : inputText).trim();
    if (!text) {
      setError(t('smartAdd.errors.emptyInput'));
      return;
    }

    try {
      setParsing(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const res = await aiTransactionApiClient.parseInput(text, i18n.language);
      setDrafts(res.data);
      setWarnings(res.warnings || []);

      if (res.data.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.message || t('smartAdd.errors.failedParse'));
    } finally {
      setParsing(false);
    }
  };

  const handleUpdateDraft = (index: number, updated: CandidateDraft) => {
    const newDrafts = [...drafts];
    newDrafts[index] = updated;
    setDrafts(newDrafts);
  };

  const handleRemoveDraft = (index: number) => {
    const newDrafts = drafts.filter((_, i) => i !== index);
    setDrafts(newDrafts);
  };

  // Confirm and record drafts into ledger
  const handleConfirm = async () => {
    // Validate amounts
    const hasInvalid = drafts.some((d) => !d.amount || parseFloat(d.amount) <= 0);
    if (hasInvalid) {
      setError(t('smartAdd.errors.invalidAmount'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setConfirming(true);
      setError(null);

      const idempotencyKey = `ai-confirm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload: ConfirmedDraftItem[] = drafts.map((d) => ({
        type: d.type,
        amount: d.amount,
        currency: d.currency || 'INR',
        description: d.description || d.categoryName,
        categoryId: d.categoryId,
        paymentMethodId: d.paymentMethodId || null,
        transactionDate: d.transactionDate,
        notes: `AI Smart Add (${d.categoryName})`,
      }));

      const res = await aiTransactionApiClient.confirmDrafts(payload, idempotencyKey);

      await Promise.all([
        refreshTransactions(),
        refreshBudgets(),
        refreshDashboard(),
        refreshInsights(),
      ]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessCount(res.count);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.message || t('smartAdd.errors.failedConfirm'));
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setInputText('');
    setDrafts([]);
    setWarnings([]);
    setSuccessCount(null);
    setError(null);
  };

  // Calculate totals
  const totalExpense = drafts
    .filter((d) => d.type === 'EXPENSE')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const totalIncome = drafts
    .filter((d) => d.type === 'INCOME')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.cardBackground,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.titleWithSparkle}>
            <Sparkles size={18} color={theme.colors.brandPrimary} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              {t('smartAdd.title')}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {t('smartAdd.subtitle')}
          </Text>
        </View>

        {drafts.length > 0 && (
          <TouchableOpacity
            onPress={handleReset}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.resetBtn}
          >
            <RotateCcw size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SUCCESS SCREEN */}
          {successCount !== null ? (
            <Card padding="lg" style={styles.successCard}>
              <View
                style={[
                  styles.successIconCircle,
                  { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                ]}
              >
                <CheckCircle2 size={48} color={theme.colors.income} />
              </View>

              <Text
                style={[
                  styles.successTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.bold,
                  },
                ]}
              >
                {t('smartAdd.successTitle')}
              </Text>

              <Text style={[styles.successSubtitle, { color: theme.colors.textMuted }]}>
                {t('smartAdd.successSubtitle', { count: successCount })}
              </Text>

              <View style={styles.successActions}>
                <TouchableOpacity
                  onPress={handleReset}
                  style={[
                    styles.addAnotherBtn,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.addAnotherText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {t('smartAdd.addAnother')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.replace('/(tabs)')}
                  style={[
                    styles.doneBtn,
                    { backgroundColor: theme.colors.brandPrimary },
                  ]}
                >
                  <Text style={styles.doneBtnText}>{t('smartAdd.doneBtn')}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <>
              {/* Natural Language Input Card */}
              <Card padding="md" style={styles.inputCard}>
                <TextInput
                  value={inputText}
                  onChangeText={(val) => {
                    setInputText(val);
                    if (error) setError(null);
                  }}
                  placeholder={t('smartAdd.inputPlaceholder')}
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.inputField,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.regular,
                    },
                  ]}
                />

                <View style={styles.inputControlsRow}>
                  {inputText.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setInputText('')}
                      style={styles.clearBtn}
                    >
                      <X size={16} color={theme.colors.textMuted} />
                      <Text style={[styles.clearBtnText, { color: theme.colors.textMuted }]}>
                        {t('smartAdd.clearBtn')}
                      </Text>
                    </TouchableOpacity>
                  ) : <View />}

                  <TouchableOpacity
                    onPress={() => handleParse()}
                    disabled={parsing || !inputText.trim()}
                    style={[
                      styles.parseBtn,
                      {
                        backgroundColor: inputText.trim()
                          ? theme.colors.brandPrimary
                          : theme.colors.surfaceSubtle,
                      },
                    ]}
                  >
                    {parsing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.parseBtnText}>
                          {t('smartAdd.parseBtn')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>

              {/* Example Prompts */}
              {drafts.length === 0 && (
                <View style={styles.examplesContainer}>
                  <Text style={[styles.examplesLabel, { color: theme.colors.textMuted }]}>
                    {t('smartAdd.examplePromptsLabel')}
                  </Text>
                  <View style={styles.examplesList}>
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          setInputText(prompt);
                          handleParse(prompt);
                        }}
                        style={[
                          styles.exampleChip,
                          {
                            backgroundColor: theme.colors.cardBackground,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exampleChipText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          &ldquo;{prompt}&rdquo;
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      borderColor: 'rgba(234, 179, 8, 0.3)',
                    },
                  ]}
                >
                  {warnings.map((w, idx) => (
                    <Text key={idx} style={[styles.errorText, { color: '#ca8a04' }]}>
                      ⚠️ {w}
                    </Text>
                  ))}
                </View>
              )}

              {/* Error Message */}
              {error ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: theme.colors.expense }]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* DRAFTS REVIEW SECTION */}
              {drafts.length > 0 && (
                <View style={styles.draftsSection}>
                  <View style={styles.reviewHeader}>
                    <Text
                      style={[
                        styles.reviewTitle,
                        {
                          color: theme.colors.textPrimary,
                          fontFamily: theme.typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {t('smartAdd.reviewTitle')} ({drafts.length})
                    </Text>
                    <Text style={[styles.reviewSubtitle, { color: theme.colors.textMuted }]}>
                      {t('smartAdd.reviewSubtitle')}
                    </Text>
                  </View>

                  {/* Summary Totals Bar */}
                  <View style={styles.totalsBar}>
                    {totalExpense > 0 && (
                      <View style={[styles.totalPill, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                        <TrendingDown size={14} color={theme.colors.expense} style={{ marginRight: 4 }} />
                        <Text style={[styles.totalLabel, { color: theme.colors.textMuted }]}>
                          {t('smartAdd.totalProposedExpense')}:{' '}
                        </Text>
                        <Text
                          style={[
                            styles.totalAmount,
                            {
                              color: theme.colors.expense,
                              fontFamily: theme.typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {formatINR(totalExpense)}
                        </Text>
                      </View>
                    )}

                    {totalIncome > 0 && (
                      <View style={[styles.totalPill, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                        <TrendingUp size={14} color={theme.colors.income} style={{ marginRight: 4 }} />
                        <Text style={[styles.totalLabel, { color: theme.colors.textMuted }]}>
                          {t('smartAdd.totalProposedIncome')}:{' '}
                        </Text>
                        <Text
                          style={[
                            styles.totalAmount,
                            {
                              color: theme.colors.income,
                              fontFamily: theme.typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {formatINR(totalIncome)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Draft Cards */}
                  {drafts.map((draft, idx) => (
                    <DraftCard
                      key={draft.draftId}
                      draft={draft}
                      index={idx}
                      totalDrafts={drafts.length}
                      onChange={(updated) => handleUpdateDraft(idx, updated)}
                      onRemove={() => handleRemoveDraft(idx)}
                    />
                  ))}

                  {/* Confirm Action Button */}
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={confirming}
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: theme.colors.brandPrimary },
                    ]}
                  >
                    {confirming ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.confirmBtnText}>
                          {t('smartAdd.confirmBtn', { count: drafts.length })}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  titleWithSparkle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  resetBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  inputCard: {
    borderRadius: 20,
    marginBottom: 16,
  },
  inputField: {
    minHeight: 80,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  inputControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  clearBtnText: {
    fontSize: 12,
    marginLeft: 4,
  },
  parseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  parseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  examplesContainer: {
    marginBottom: 20,
  },
  examplesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  examplesList: {
    gap: 8,
  },
  exampleChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  exampleChipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
  },
  draftsSection: {
    marginTop: 8,
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  reviewSubtitle: {
    fontSize: 12,
  },
  totalsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 13,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  successCard: {
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  addAnotherBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
