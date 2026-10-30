import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  subtitle,
  actionTitle,
  onAction,
  style,
}: SectionHeaderProps) {
  const { theme } = useTheme();
  const haptics = useHaptics();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textColumn}>
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
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {actionTitle && onAction && (
        <Pressable
          onPress={() => {
            haptics.selection();
            onAction();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionPressable}
          accessibilityRole="button"
          accessibilityLabel={actionTitle}
        >
          <Text
            style={[
              styles.actionText,
              {
                color: theme.colors.brandAccent,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {actionTitle}
          </Text>
          <ChevronRight size={14} color={theme.colors.brandAccent} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
});
