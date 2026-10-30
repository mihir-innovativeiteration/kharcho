import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { AlertTriangle, Lightbulb, PiggyBank, Sparkles, Utensils } from 'lucide-react-native';

interface InsightItem {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'tip';
  title: string;
  description: string;
  icon: string;
}

interface HighlightInsightCardProps {
  insight: InsightItem;
}

export function HighlightInsightCard({ insight }: HighlightInsightCardProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (insight.type) {
      case 'positive':
        return {
          bg: theme.colors.incomeLight,
          border: theme.isDark ? '#1C382E' : '#A7F3D0',
          text: theme.colors.income,
        };
      case 'warning':
        return {
          bg: theme.colors.warningLight,
          border: theme.isDark ? '#3D2F15' : '#FDE68A',
          text: theme.colors.warning,
        };
      case 'tip':
        return {
          bg: theme.colors.infoLight,
          border: theme.isDark ? '#1A2942' : '#BFDBFE',
          text: theme.colors.info,
        };
      default:
        return {
          bg: theme.colors.surfaceSubtle,
          border: theme.colors.border,
          text: theme.colors.brandPrimary,
        };
    }
  };

  const renderIcon = () => {
    const iconColor = colors.text;
    const size = 18;
    switch (insight.icon) {
      case 'PiggyBank':
        return <PiggyBank size={size} color={iconColor} strokeWidth={2.2} />;
      case 'AlertTriangle':
        return <AlertTriangle size={size} color={iconColor} strokeWidth={2.2} />;
      case 'Sparkles':
        return <Sparkles size={size} color={iconColor} strokeWidth={2.2} />;
      case 'Utensils':
        return <Utensils size={size} color={iconColor} strokeWidth={2.2} />;
      default:
        return <Lightbulb size={size} color={iconColor} strokeWidth={2.2} />;
    }
  };

  const colors = getColors();

  return (
    <Card
      padding="md"
      style={[
        styles.card,
        {
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: colors.text,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
          {renderIcon()}
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.semiBold,
              },
            ]}
          >
            {insight.title}
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
          >
            {insight.description}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
