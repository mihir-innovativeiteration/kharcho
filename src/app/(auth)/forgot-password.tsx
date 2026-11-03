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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/api/authApi';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      haptics.error();
      setError(t('validation.emailInvalid'));
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const res = await authApi.forgotPassword(email.trim());
      haptics.success();
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setSubmitted(true);
    } catch (e: any) {
      haptics.error();
      setError(e.message || 'Unable to process request');
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
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
          <Text
            style={[
              styles.backText,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {t('common.back')}
          </Text>
        </Pressable>

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
            {t('auth.forgotPasswordTitle')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.forgotPasswordSub')}
          </Text>
        </View>

        {submitted ? (
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <CheckCircle2 size={36} color={theme.colors.income} style={styles.checkIcon} />
            <Text
              style={[
                styles.successTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              Check your inbox
            </Text>
            <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
              {t('auth.passwordResetSent')}
            </Text>

            <Button
              title="Set New Password Now"
              onPress={() =>
                router.push({
                  pathname: '/(auth)/reset-password',
                  params: resetToken ? { token: resetToken } : {},
                })
              }
              variant="primary"
              size="md"
              fullWidth
              style={{ marginTop: 16 }}
            />

            <Button
              title={t('auth.backToSignIn')}
              onPress={() => router.replace('/(auth)/sign-in')}
              variant="ghost"
              size="md"
              fullWidth
              style={styles.backBtn}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftElement={<Mail size={18} color={theme.colors.textMuted} />}
              error={error}
            />

            <Button
              title={t('auth.sendResetLink')}
              onPress={handleSubmit}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 8,
  },
  backText: {
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
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
  backBtn: {
    marginTop: 4,
  },
});
