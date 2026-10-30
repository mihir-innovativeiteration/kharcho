export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;

  brandPrimary: string;
  brandPrimaryDark: string;
  brandSecondary: string;
  brandAccent: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;

  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  border: string;
  borderLight: string;
  borderStrong: string;

  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  cardBackground: string;
  cardBorder: string;
  heroCardBackground: string;
  heroCardText: string;

  chartGreen: string;
  chartRose: string;
  chartAmber: string;
  chartBlue: string;
  chartPurple: string;
  chartTeal: string;
}

export interface SpacingTokens {
  none: 0;
  xxs: 2;
  xs: 4;
  sm: 8;
  md: 12;
  lg: 16;
  xl: 20;
  xxl: 24;
  xxxl: 32;
  massive: 40;
}

export interface RadiusTokens {
  none: 0;
  xs: 4;
  sm: 8;
  md: 12;
  lg: 16;
  xl: 20;
  pill: 9999;
}

export interface TypographyTokens {
  fontFamily: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  fontSize: {
    display: number;
    title1: number;
    title2: number;
    title3: number;
    headline: number;
    body: number;
    callout: number;
    subhead: number;
    footnote: number;
    caption: number;
  };
  lineHeight: {
    display: number;
    title1: number;
    title2: number;
    title3: number;
    headline: number;
    body: number;
    callout: number;
    subhead: number;
    footnote: number;
    caption: number;
  };
}

export interface ShadowTokens {
  subtle: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  elevated: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface ThemeTokens {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  animation: {
    fast: number;
    normal: number;
    slow: number;
  };
  touchTarget: number;
}
