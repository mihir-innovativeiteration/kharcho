import { Platform } from 'react-native';
import { RadiusTokens, ShadowTokens, SpacingTokens, TypographyTokens } from '@/types/theme';

export const spacing: SpacingTokens = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  massive: 40,
};

export const radius: RadiusTokens = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const typography: TypographyTokens = {
  fontFamily: {
    regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    semiBold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  fontSize: {
    display: 34,
    title1: 28,
    title2: 22,
    title3: 18,
    headline: 16,
    body: 15,
    callout: 14,
    subhead: 13,
    footnote: 12,
    caption: 11,
  },
  lineHeight: {
    display: 40,
    title1: 34,
    title2: 28,
    title3: 24,
    headline: 22,
    body: 20,
    callout: 18,
    subhead: 16,
    footnote: 15,
    caption: 13,
  },
};

export const lightShadows: ShadowTokens = {
  subtle: {
    shadowColor: '#0F382C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F382C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F382C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const darkShadows: ShadowTokens = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};

export const TOUCH_TARGET_MIN = 48;
