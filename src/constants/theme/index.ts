import { darkColors, lightColors } from './colors';
import { animation, darkShadows, lightShadows, radius, spacing, typography, TOUCH_TARGET_MIN } from './tokens';
import { ThemeMode, ThemeTokens } from '@/types/theme';

export function getThemeTokens(mode: 'light' | 'dark', preference: ThemeMode = 'system'): ThemeTokens {
  const isDark = mode === 'dark';
  return {
    isDark,
    mode: preference,
    colors: isDark ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    shadows: isDark ? darkShadows : lightShadows,
    animation,
    touchTarget: TOUCH_TARGET_MIN,
  };
}

export * from './colors';
export * from './tokens';
