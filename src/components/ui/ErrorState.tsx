import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button } from './Button';
import { useTheme } from '@/hooks/useTheme';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error loading your records. Please try again.',
  onRetry,
  style,
}: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.expenseLight,
          },
        ]}
      >
        <AlertCircle size={36} color={theme.colors.expense} strokeWidth={2} />
      </View>

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.semiBold,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
          },
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <Button
          title="Retry"
          onPress={onRetry}
          variant="outline"
          size="md"
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  retryButton: {
    minWidth: 120,
  },
});
