import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();
  const haptics = useHaptics();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
        style,
      ]}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!isSelected) {
                haptics.selection();
                onChange(option.value);
              }
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              {
                backgroundColor: isSelected
                  ? theme.colors.surface
                  : 'transparent',
                borderRadius: theme.radius.md,
                ...(isSelected ? theme.shadows.subtle : {}),
              },
            ]}
          >
            {option.icon && <View style={styles.icon}>{option.icon}</View>}
            <Text
              style={[
                styles.label,
                {
                  color: isSelected
                    ? theme.isDark
                      ? theme.colors.brandAccent
                      : theme.colors.brandPrimary
                    : theme.colors.textSecondary,
                  fontFamily: isSelected
                    ? theme.typography.fontFamily.semiBold
                    : theme.typography.fontFamily.medium,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 38,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    textAlign: 'center',
  },
});
