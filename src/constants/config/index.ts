export const APP_CONFIG = {
  name: 'Kharcho',
  tagline: 'Understand your money, live in peace',
  version: '1.0.0',
  build: '1',
  currency: {
    symbol: '₹',
    code: 'INR',
    name: 'Indian Rupee',
    locale: 'en-IN',
  },
  supportEmail: 'support@kharcho.app',
  privacyPolicyUrl: 'https://kharcho.app/privacy',
  termsUrl: 'https://kharcho.app/terms',
  storageKeys: {
    hasCompletedOnboarding: '@kharcho_onboarding_completed_v1',
    themePreference: '@kharcho_theme_preference_v1',
    showPreviewData: '@kharcho_preview_data_enabled_v1',
    currencyPreference: '@kharcho_currency_preference_v1',
    userProfile: '@kharcho_user_profile_v1',
  },
};

export * from './categories';
