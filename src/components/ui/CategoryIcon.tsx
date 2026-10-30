import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Shirt,
  HeartPulse,
  Film,
  Home,
  TrendingUp,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Coins,
  Gift,
  CircleDollarSign,
  Tag,
  CreditCard,
  LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Shirt,
  HeartPulse,
  Film,
  Home,
  TrendingUp,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Coins,
  Gift,
  CircleDollarSign,
  CreditCard,
};

interface CategoryIconProps {
  iconName?: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
}

export function CategoryIcon({
  iconName = 'Tag',
  color,
  backgroundColor,
  size = 'md',
  style,
}: CategoryIconProps) {
  const { theme } = useTheme();

  const IconComponent = ICON_MAP[iconName] || Tag;

  const sizeConfigs = {
    sm: { container: 32, icon: 16, radius: 8 },
    md: { container: 44, icon: 22, radius: 12 },
    lg: { container: 52, icon: 26, radius: 14 },
    xl: { container: 64, icon: 32, radius: 18 },
  };

  const currentSize = sizeConfigs[size];
  const iconColor = color || theme.colors.brandPrimary;
  const containerBg =
    backgroundColor ||
    (theme.isDark ? `${iconColor}25` : `${iconColor}15`);

  return (
    <View
      style={[
        styles.container,
        {
          width: currentSize.container,
          height: currentSize.container,
          borderRadius: currentSize.radius,
          backgroundColor: containerBg,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={iconName}
    >
      <IconComponent size={currentSize.icon} color={iconColor} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
