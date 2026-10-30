import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'surface' | 'ghost' | 'brand' | 'subtle';
  badge?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'surface',
  badge = false,
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled) return;
    haptics.selection();
    onPress();
  };

  const dimensions = {
    sm: 36,
    md: 44,
    lg: 52,
  }[size];

  const getBackgroundColor = (pressed: boolean) => {
    switch (variant) {
      case 'surface':
        return pressed ? theme.colors.surfaceSubtle : theme.colors.surface;
      case 'subtle':
        return pressed ? theme.colors.borderStrong : theme.colors.surfaceSubtle;
      case 'brand':
        return pressed ? theme.colors.brandPrimaryDark : theme.colors.brandPrimary;
      case 'ghost':
        return pressed ? theme.colors.surfaceSubtle : 'transparent';
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width: dimensions,
          height: dimensions,
          borderRadius: dimensions / 2,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === 'surface' ? theme.colors.border : 'transparent',
          borderWidth: variant === 'surface' ? 1 : 0,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {icon}
      {badge && (
        <View
          style={[
            styles.badgeDot,
            {
              backgroundColor: theme.colors.expense,
              borderColor: theme.colors.surface,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
  },
});
