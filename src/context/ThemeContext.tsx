import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { APP_CONFIG } from '@/constants/config';
import { getThemeTokens } from '@/constants/theme';
import { storage } from '@/services/storage';
import { ThemeMode, ThemeTokens } from '@/types/theme';

interface ThemeContextType {
  theme: ThemeTokens;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadThemePreference() {
      try {
        const saved = await storage.getItem(APP_CONFIG.storageKeys.themePreference);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch {
        // Fallback to system default
      } finally {
        setIsReady(true);
      }
    }
    loadThemePreference();
  }, []);

  const effectiveMode: 'light' | 'dark' =
    themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const themeTokens = getThemeTokens(effectiveMode, themeMode);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await storage.setItem(APP_CONFIG.storageKeys.themePreference, mode);
  };

  if (!isReady) {
    // Render with initial default tokens while loading preference
    return (
      <ThemeContext.Provider
        value={{
          theme: getThemeTokens(systemColorScheme === 'dark' ? 'dark' : 'light', 'system'),
          themeMode: 'system',
          setThemeMode,
          isDark: systemColorScheme === 'dark',
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: themeTokens,
        themeMode,
        setThemeMode,
        isDark: effectiveMode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
