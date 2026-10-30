import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0 to 100 (can be > 100 if over budget)
  color?: string;
  autoColorByThreshold?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color,
  autoColorByThreshold = false,
  height = 8,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme();

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const getFillColor = () => {
    if (color) return color;
    if (autoColorByThreshold) {
      if (progress >= 100) return theme.colors.expense;
      if (progress >= 85) return theme.colors.warning;
      return theme.colors.brandAccent;
    }
    return theme.colors.brandAccent;
  };

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.colors.surfaceSubtle,
          borderRadius: height / 2,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            backgroundColor: getFillColor(),
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 4,
  },
});
