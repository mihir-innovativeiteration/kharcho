import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { user, refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(Boolean(user?.isEmailVerified));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = useCallback(
    async (tokenToVerify = token) => {
      if (!tokenToVerify.trim()) {
        haptics.error();
        setErrorMessage('Please enter or provide a verification token');
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        await authApi.verifyEmail(tokenToVerify.trim());
        haptics.success();
        setVerified(true);
        setStatusMessage('Your email address has been successfully verified!');
        await refreshProfile();
      } catch (e: any) {
        haptics.error();
        setErrorMessage(e.message || 'Verification token is invalid or expired');
      } finally {
        setLoading(false);
      }
    },
    [token, haptics, refreshProfile]
  );

  const hasAutoVerifiedRef = useRef(false);

  // If token is passed in deep link or query params, auto-verify
  useEffect(() => {
    if (params.token && !hasAutoVerifiedRef.current) {
      hasAutoVerifiedRef.current = true;
      const paramToken = params.token;
      const timer = setTimeout(() => {
        void handleVerify(paramToken);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [params.token, handleVerify]);

  const handleResend = async () => {
    if (!user?.email) return;

    setResending(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await authApi.resendVerification(user.email);
      haptics.success();
      setStatusMessage(t('auth.verificationSent'));
    } catch (e: any) {
      haptics.error();
      setErrorMessage(e.message || 'Unable to resend verification email');
    } finally {
      setResending(false);
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
            paddingTop: insets.top + 32,
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
                backgroundColor: verified
                  ? theme.colors.incomeLight
                  : theme.isDark
                  ? '#1E332D'
                  : '#ECFDF5',
              },
            ]}
          >
            {verified ? (
              <CheckCircle2 size={36} color={theme.colors.income} strokeWidth={2.4} />
            ) : (
              <Mail size={32} color={theme.colors.brandAccent} strokeWidth={2.2} />
            )}
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
            {verified ? 'Email Verified' : t('auth.verifyEmailTitle')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {verified
              ? 'Your email address is confirmed. You now have full access to all Kharcho features.'
              : t('auth.verifyEmailSub')}
          </Text>
        </View>

        {statusMessage ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.incomeLight,
                borderColor: theme.colors.income,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.income }]}>
              {statusMessage}
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.expenseLight,
                borderColor: theme.colors.expense,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.expense }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {verified ? (
          <Button
            title="Continue to Kharcho"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.actionBtn}
          />
        ) : (
          <View style={styles.form}>
            {!params.token && (
              <Input
                label="Verification Token"
                placeholder="Enter or paste token from email"
                value={token}
                onChangeText={setToken}
              />
            )}

            <Button
              title="Verify Email"
              onPress={() => handleVerify()}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.actionBtn}
            />

            {user?.email && (
              <Button
                title={t('auth.resendVerification')}
                onPress={handleResend}
                loading={resending}
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<RefreshCw size={16} color={theme.colors.textPrimary} />}
                style={styles.resendBtn}
              />
            )}

            <Button
              title={t('common.continue')}
              onPress={() => router.replace('/(tabs)')}
              variant="ghost"
              size="md"
              fullWidth
              style={styles.ghostBtn}
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
    width: 68,
    height: 68,
    borderRadius: 22,
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
  statusBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  actionBtn: {
    marginBottom: 12,
  },
  resendBtn: {
    marginBottom: 12,
  },
  ghostBtn: {
    marginTop: 4,
  },
});
