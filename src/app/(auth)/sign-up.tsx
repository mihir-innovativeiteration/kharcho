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
import { Eye, EyeOff, Lock, Mail, User, Wallet } from 'lucide-react-native';

export default function SignUpScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (name.trim().length < 2) {
      newErrors.name = t('validation.nameTooShort');
    }

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('validation.passwordTooShort');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      haptics.error();
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      haptics.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      haptics.error();
      setErrors({ general: e.message || 'Failed to create account' });
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
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: theme.colors.brandPrimary,
              },
            ]}
          >
            <Wallet size={28} color="#34D399" strokeWidth={2.4} />
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
            {t('auth.signUpTitle')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.signUpSub')}
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
            label={t('auth.nameLabel')}
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            autoCapitalize="words"
            leftElement={<User size={18} color={theme.colors.textMuted} />}
            error={errors.name}
          />

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

          <Input
            label={t('auth.confirmPasswordLabel')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            leftElement={<Lock size={18} color={theme.colors.textMuted} />}
            error={errors.confirmPassword}
          />

          <Text style={[styles.termsText, { color: theme.colors.textMuted }]}>
            {t('auth.termsNotice')}
          </Text>

          <Button
            title={t('auth.signUp')}
            onPress={handleSignUp}
            loading={loading}
            disabled={googleLoading || facebookLoading}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.submitBtn}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
              {t('common.or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

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

        {/* Link to Sign In */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('auth.haveAccount')}{' '}
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/sign-in')}
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
              {t('auth.signIn')}
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
    marginBottom: 20,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -4,
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
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
