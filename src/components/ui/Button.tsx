import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'emerald';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let bg = theme.colors.brandPrimary;
    let border = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = theme.isDark ? theme.colors.brandPrimary : '#0F382C';
        break;
      case 'emerald':
        bg = theme.colors.brandAccent;
        break;
      case 'secondary':
        bg = theme.colors.surfaceSubtle;
        break;
      case 'outline':
        bg = 'transparent';
        border = theme.colors.borderStrong;
        borderWidth = 1.5;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'danger':
        bg = theme.colors.expense;
        break;
    }

    const sizePadding = {
      sm: { height: 38, paddingHorizontal: theme.spacing.md },
      md: { height: 48, paddingHorizontal: theme.spacing.xl },
      lg: { height: 56, paddingHorizontal: theme.spacing.xxl },
    }[size];

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      borderRadius: theme.radius.lg,
      height: sizePadding.height,
      minHeight: theme.touchTarget,
      paddingHorizontal: sizePadding.paddingHorizontal,
      opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
      alignSelf: fullWidth ? 'stretch' : 'auto',
    };
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.textMuted;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'emerald':
        return '#FFFFFF';
      case 'secondary':
        return theme.colors.textPrimary;
      case 'outline':
        return theme.colors.textPrimary;
      case 'ghost':
        return theme.colors.brandPrimary;
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getTextFontSize = (): number => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSize.subhead;
      case 'md':
        return theme.typography.fontSize.body;
      case 'lg':
        return theme.typography.fontSize.headline;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [styles.base, getContainerStyle(pressed), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.iconMarginRight}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getTextFontSize(),
                fontFamily: theme.typography.fontFamily.semiBold,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.iconMarginLeft}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  iconMarginRight: {
    marginRight: 8,
  },
  iconMarginLeft: {
    marginLeft: 8,
  },
});
