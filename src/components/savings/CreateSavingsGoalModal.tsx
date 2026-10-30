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
import { Info, PiggyBank, Shield, Sparkles, Target, X } from 'lucide-react-native';

interface CreateSavingsGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    targetAmount: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { name: 'PiggyBank', label: 'Savings', icon: PiggyBank, color: '#10B981' },
  { name: 'Shield', label: 'Emergency', icon: Shield, color: '#3B82F6' },
  { name: 'Target', label: 'Milestone', icon: Target, color: '#F97316' },
  { name: 'Sparkles', label: 'Dream', icon: Sparkles, color: '#EC4899' },
];

export function CreateSavingsGoalModal({ visible, onClose, onSubmit }: CreateSavingsGoalModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('PiggyBank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIconConfig = AVAILABLE_ICONS.find((i) => i.name === selectedIcon) || AVAILABLE_ICONS[0];

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('savings.errors.nameRequired', 'Please enter a goal name'));
      haptics.error();
      return;
    }

    const numAmount = parseFloat(targetAmount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('savings.errors.amountRequired', 'Please enter a valid target amount'));
      haptics.error();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: numAmount.toFixed(2),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedIconConfig.color,
      });
      haptics.success();
      setName('');
      setTargetAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      haptics.error();
      setError(err?.message || t('savings.errors.failedCreate', 'Failed to create goal'));
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
                {t('savings.createTitle', 'Create Savings Goal')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {t('savings.createSubtitle', 'Track milestone savings with manual entries')}
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
            {/* Goal Name Input */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('savings.nameLabel', 'Goal Name')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Emergency Fund, Goa Trip, New Laptop"
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

            {/* Target Amount */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('savings.targetAmountLabel', 'Target Amount (₹)')}
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
                placeholder="₹ 50,000"
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

            {/* Icon Picker */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('savings.iconLabel', 'Choose Icon')}
              </Text>
              <View style={styles.iconRow}>
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = selectedIcon === item.name;
                  return (
                    <Pressable
                      key={item.name}
                      onPress={() => {
                        haptics.selection();
                        setSelectedIcon(item.name);
                      }}
                      style={[
                        styles.iconOption,
                        {
                          borderColor: isSelected ? item.color : theme.colors.borderLight,
                          backgroundColor: isSelected
                            ? theme.isDark
                              ? '#142E25'
                              : '#ECFDF5'
                            : theme.colors.surfaceSubtle,
                        },
                      ]}
                    >
                      <IconComp size={20} color={item.color} strokeWidth={2.2} />
                      <Text
                        style={[
                          styles.iconText,
                          {
                            color: isSelected ? item.color : theme.colors.textSecondary,
                            fontFamily: isSelected
                              ? theme.typography.fontFamily.semiBold
                              : theme.typography.fontFamily.regular,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Description (Optional) */}
            <View style={styles.sectionMargin}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {t('savings.descriptionLabel', 'Description / Note (Optional)')}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Setting aside 5,000 INR each month"
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

            {/* Prominent Bank Notice */}
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
                  'savings.manualNotice',
                  'Kharcho savings goals track manual contributions for personal discipline. Reaching a goal does not transfer money to a bank account.'
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
                title={t('savings.saveGoal', 'Create Goal')}
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
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  iconText: {
    fontSize: 11,
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
