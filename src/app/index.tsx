import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { Wallet } from 'lucide-react-native';

export default function IndexScreen() {
  const { hasCompletedOnboarding } = useApp();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { theme } = useTheme();

  // Show splash while restoring session or reading onboarding flag
  if (hasCompletedOnboarding === null || isAuthLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.logoCircle,
            {
              backgroundColor: theme.colors.brandPrimary,
            },
          ]}
        >
          <Wallet size={36} color="#34D399" strokeWidth={2.2} />
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
          Kharcho
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Understand your money
        </Text>
        <ActivityIndicator
          size="small"
          color={theme.colors.brandAccent}
          style={styles.indicator}
        />
      </View>
    );
  }

  // 1. First-time users see onboarding
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // 2. Unauthenticated users are directed to Sign In
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // 3. Authenticated users land on Home dashboard
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  indicator: {
    marginTop: 16,
  },
});
