import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { DashboardPeriod } from '@/hooks/useDashboardData';

interface PeriodSelectorProps {
  selectedPeriod: DashboardPeriod;
  onSelectPeriod: (period: DashboardPeriod) => void;
}

export function PeriodSelector({ selectedPeriod, onSelectPeriod }: PeriodSelectorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const periods: { key: DashboardPeriod; labelKey: string; fallback: string }[] = [
    { key: 'this_month', labelKey: 'dashboard.periods.thisMonth', fallback: 'This Month' },
    { key: 'last_month', labelKey: 'dashboard.periods.lastMonth', fallback: 'Last Month' },
    { key: 'last_6_months', labelKey: 'dashboard.periods.last6Months', fallback: 'Last 6M' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole="tablist"
    >
      {periods.map((item) => {
        const isSelected = selectedPeriod === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (selectedPeriod !== item.key) {
                haptics.selection();
                onSelectPeriod(item.key);
              }
            }}
            style={[
              styles.segment,
              isSelected && [
                styles.selectedSegment,
                {
                  backgroundColor: theme.isDark ? theme.colors.brandPrimary : '#FFFFFF',
                  shadowColor: theme.isDark ? '#000000' : '#0F382C',
                },
              ],
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={t(item.labelKey, item.fallback)}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected
                    ? theme.isDark
                      ? theme.colors.brandAccent
                      : theme.colors.brandPrimary
                    : theme.colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                  fontFamily: isSelected
                    ? theme.typography.fontFamily.semiBold
                    : theme.typography.fontFamily.medium,
                },
              ]}
              numberOfLines={1}
            >
              {t(item.labelKey, item.fallback)}
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
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  selectedSegment: {
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 13,
  },
});
