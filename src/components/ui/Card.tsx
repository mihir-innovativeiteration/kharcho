import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'subtle' | 'hero' | 'outlined';
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  variant = 'default',
  style,
  padding = 'lg',
  accessibilityLabel,
}: CardProps) {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const paddingValues = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl,
  }[padding];

  const getContainerStyle = (pressed = false): ViewStyle => {
    let bg = theme.colors.surface;
    let borderColor = theme.colors.border;
    let shadow = theme.shadows.subtle;

    switch (variant) {
      case 'default':
        bg = theme.colors.surface;
        borderColor = theme.colors.border;
        shadow = theme.shadows.subtle;
        break;
      case 'elevated':
        bg = theme.colors.surfaceElevated;
        borderColor = theme.colors.borderLight;
        shadow = theme.shadows.card;
        break;
      case 'subtle':
        bg = theme.colors.surfaceSubtle;
        borderColor = 'transparent';
        shadow = {
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        };
        break;
      case 'hero':
        bg = theme.colors.heroCardBackground;
        borderColor = theme.isDark ? '#234439' : '#0B2920';
        shadow = theme.shadows.elevated;
        break;
      case 'outlined':
        bg = 'transparent';
        borderColor = theme.colors.borderStrong;
        shadow = {
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        };
        break;
    }

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth: 1,
      borderRadius: theme.radius.xl,
      padding: paddingValues,
      opacity: pressed ? 0.92 : 1,
      ...shadow,
    };
  };

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptics.selection();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [getContainerStyle(pressed), style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[getContainerStyle(), style]}>{children}</View>;
}
