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
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/api/authApi';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ token?: string; password?: string; confirm?: string; general?: string }>({});

  const effectiveToken = (token || params.token || '').trim();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!effectiveToken) {
      newErrors.token = 'Reset token is required';
    }

    if (!newPassword) {
      newErrors.password = t('validation.passwordRequired');
    } else if (newPassword.length < 8) {
      newErrors.password = t('validation.passwordTooShort');
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirm = t('validation.passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) {
      haptics.error();
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authApi.resetPassword(effectiveToken, newPassword);
      haptics.success();
      setSuccess(true);
    } catch (e: any) {
      haptics.error();
      setErrors({ general: e.message || 'Unable to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.isDark ? '#1E332D' : '#ECFDF5',
              },
            ]}
          >
            <KeyRound size={32} color={theme.colors.brandAccent} strokeWidth={2.2} />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {t('auth.resetPasswordTitle')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.resetPasswordSub')}
          </Text>
        </View>

        {errors.general ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.expenseLight,
                borderColor: theme.colors.expense,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: theme.colors.expense }]}>
              {errors.general}
            </Text>
          </View>
        ) : null}

        {success ? (
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ShieldCheck size={36} color={theme.colors.income} style={styles.checkIcon} />
            <Text
              style={[
                styles.successTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              Password Updated
            </Text>
            <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
              Your password has been securely updated. You can now sign in with your new credentials.
            </Text>

            <Button
              title={t('auth.signIn')}
              onPress={() => router.replace('/(auth)/sign-in')}
              variant="primary"
              size="md"
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.form}>
            {!params.token && (
              <Input
                label="Reset Security Token"
                placeholder="Paste the reset token received"
                value={token}
                onChangeText={(text) => {
                  setToken(text);
                  if (errors.token) setErrors((prev) => ({ ...prev, token: undefined }));
                }}
                error={errors.token}
              />
            )}

            <Input
              label={t('auth.newPasswordLabel')}
              placeholder={t('auth.newPasswordPlaceholder')}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              leftElement={<Lock size={18} color={theme.colors.textMuted} />}
              rightElement={
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={theme.colors.textMuted} />
                  ) : (
                    <Eye size={18} color={theme.colors.textMuted} />
                  )}
                </Pressable>
              }
              error={errors.password}
            />

            <Input
              label={t('auth.confirmPasswordLabel')}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              leftElement={<Lock size={18} color={theme.colors.textMuted} />}
              error={errors.confirm}
            />

            <Button
              title={t('auth.updatePassword')}
              onPress={handleResetPassword}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.submitBtn}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 8,
  },
  successCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  checkIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});
