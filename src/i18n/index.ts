/* eslint-disable import/no-named-as-default-member */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '@/services/storage';
import en from './locales/en.json';
import gu from './locales/gu.json';
import hi from './locales/hi.json';

const LANGUAGE_STORAGE_KEY = '@kharcho_language_preference_v2';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const resources = {
  en: { translation: en },
  gu: { translation: gu },
  hi: { translation: hi },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

/**
 * Load persisted language preference on app startup
 */
export async function initLanguage(): Promise<void> {
  try {
    const saved = await storage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'gu' || saved === 'hi')) {
      await i18n.changeLanguage(saved);
    }
  } catch (e) {
    console.warn('Failed to load language preference:', e);
  }
}

/**
 * Change language and persist preference
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  await storage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export default i18n;
