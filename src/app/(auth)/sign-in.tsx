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
import { GoogleButton } from '@/components/ui/GoogleButton';
import { FacebookButton } from '@/components/ui/FacebookButton';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { promptGoogleSignIn } from '@/utils/googleAuth';
import { promptFacebookSignIn } from '@/utils/facebookAuth';
import { Eye, EyeOff, Lock, Mail, Wallet } from 'lucide-react-native';

export default function SignInScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) {
      haptics.error();
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login({ email: email.trim(), password });
      haptics.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      haptics.error();
      setErrors({ general: e.message || 'Failed to sign in' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrors({});

    try {
      const idToken = await promptGoogleSignIn();
      await loginWithGoogle(idToken);
      haptics.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        haptics.error();
        setErrors({ general: e.message || 'Google Sign-In failed' });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    setErrors({});

    try {
      const accessToken = await promptFacebookSignIn();
      await loginWithFacebook(accessToken);
      haptics.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        haptics.error();
        setErrors({ general: e.message || 'Facebook Sign-In failed' });
      }
    } finally {
      setFacebookLoading(false);
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding & Logo */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: theme.colors.brandPrimary,
              },
            ]}
          >
            <Wallet size={32} color="#34D399" strokeWidth={2.4} />
          </View>

          <Text
            style={[
              styles.appName,
              {
                color: theme.colors.brandAccent,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {t('common.appName')}
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {t('auth.welcomeBack')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.signInSub')}
          </Text>
        </View>

        {/* General Error Banner */}
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

        {/* Form Inputs */}
        <View style={styles.form}>
          <Input
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftElement={<Mail size={18} color={theme.colors.textMuted} />}
            error={errors.email}
          />

          <Input
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
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
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
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

          {/* Forgot Password Link */}
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotPasswordPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                { color: theme.colors.brandAccent },
              ]}
            >
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>

          {/* Primary Sign In Button */}
          <Button
            title={t('auth.signIn')}
            onPress={handleSignIn}
            loading={loading}
            disabled={googleLoading || facebookLoading}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.submitBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
              {t('common.or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Social Sign In Options */}
          <View style={styles.socialContainer}>
            <GoogleButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading || facebookLoading}
            />
            <FacebookButton
              onPress={handleFacebookSignIn}
              loading={facebookLoading}
              disabled={loading || googleLoading}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>

        {/* Link to Sign Up */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('auth.noAccount')}{' '}
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: theme.colors.brandAccent,
                  fontFamily: theme.typography.fontFamily.semiBold,
                },
              ]}
            >
              {t('auth.signUp')}
            </Text>
          </Pressable>
        </View>
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
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
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
  forgotPasswordPress: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  socialContainer: {
    width: '100%',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
