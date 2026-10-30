import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  helperText,
  leftElement,
  rightElement,
  containerStyle,
  inputStyle,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.colors.expense;
    if (isFocused) return theme.isDark ? theme.colors.brandAccent : theme.colors.brandPrimary;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.expense : theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.medium,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 1.5 : 1,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}

        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.body,
              fontFamily: theme.typography.fontFamily.regular,
            },
            inputStyle,
          ]}
          {...rest}
        />

        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>

      {error ? (
        <Text style={[styles.helperText, { color: theme.colors.expense }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  leftElement: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightElement: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});
