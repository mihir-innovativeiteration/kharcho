import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
  icon,
}: BadgeProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.colors.incomeLight,
          text: theme.colors.income,
          border: theme.isDark ? 'transparent' : '#A7F3D0',
        };
      case 'danger':
        return {
          bg: theme.colors.expenseLight,
          text: theme.colors.expense,
          border: theme.isDark ? 'transparent' : '#FECDD3',
        };
      case 'warning':
        return {
          bg: theme.colors.warningLight,
          text: theme.colors.warning,
          border: theme.isDark ? 'transparent' : '#FDE68A',
        };
      case 'info':
        return {
          bg: theme.colors.infoLight,
          text: theme.colors.info,
          border: theme.isDark ? 'transparent' : '#BFDBFE',
        };
      case 'brand':
        return {
          bg: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#E6F4EA',
          text: theme.colors.brandPrimary,
          border: 'transparent',
        };
      default:
        return {
          bg: theme.colors.surfaceSubtle,
          text: theme.colors.textSecondary,
          border: theme.colors.border,
        };
    }
  };

  const colors = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 1,
          paddingHorizontal: isSm ? 6 : 8,
          paddingVertical: isSm ? 2 : 4,
          borderRadius: theme.radius.pill,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconMargin}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isSm ? 10 : 12,
            fontFamily: theme.typography.fontFamily.medium,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  iconMargin: {
    marginRight: 4,
  },
});
