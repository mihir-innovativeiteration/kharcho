import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, UserProfileData } from '@/services/api/authApi';
import { storage } from '@/services/storage';
import { changeLanguage, SupportedLanguage } from '@/i18n';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  user: UserProfileData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: { name?: string; preferredLanguage?: string; preferredTheme?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setThemeMode } = useTheme();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    authApi.setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  // Restore existing session on app startup
  useEffect(() => {
    async function restoreSession() {
      try {
        // Fast restore from cached profile so user identity shows immediately
        const cachedUserStr = await storage.getItem('kharcho_cached_user_profile');
        if (cachedUserStr) {
          try {
            setUser(JSON.parse(cachedUserStr));
          } catch {
            // Ignore parse error
          }
        }

        await authApi.initStoredTokens();
        const storedRefreshToken = await authApi.getStoredRefreshToken();
        if (storedRefreshToken) {
          try {
            await authApi.refreshToken();
          } catch (e) {
            console.warn('Initial token refresh note:', e);
          }

          try {
            const profile = await authApi.getMe();
            setUser(profile);
            await storage.setItem('kharcho_cached_user_profile', JSON.stringify(profile));

            // Synchronize language and theme preferences from verified profile
            if (profile.preferredLanguage) {
              await changeLanguage(profile.preferredLanguage as SupportedLanguage);
            }
            if (profile.preferredTheme === 'light' || profile.preferredTheme === 'dark') {
              await setThemeMode(profile.preferredTheme);
            }
          } catch {
            if (!authApi.getAccessToken()) {
              await authApi.clearStoredSession();
              setUser(null);
            }
          }
        } else if (!authApi.getAccessToken()) {
          setUser(null);
        }
      } catch {
        if (!authApi.getAccessToken()) {
          await authApi.clearStoredSession();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [setThemeMode]);

  const login = async (data: { email: string; password: string }) => {
    const res = await authApi.login(data);
    setUser(res.user);
    await storage.setItem('kharcho_cached_user_profile', JSON.stringify(res.user));
    if (res.user.preferredLanguage) {
      await changeLanguage(res.user.preferredLanguage as SupportedLanguage);
    }
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    setUser(res.user);
    await storage.setItem('kharcho_cached_user_profile', JSON.stringify(res.user));
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await authApi.googleAuth(idToken);
    setUser(res.user);
    await storage.setItem('kharcho_cached_user_profile', JSON.stringify(res.user));
    if (res.user.preferredLanguage) {
      await changeLanguage(res.user.preferredLanguage as SupportedLanguage);
    }
  };

  const loginWithFacebook = async (accessToken: string) => {
    const res = await authApi.facebookAuth(accessToken);
    setUser(res.user);
    await storage.setItem('kharcho_cached_user_profile', JSON.stringify(res.user));
    if (res.user.preferredLanguage) {
      await changeLanguage(res.user.preferredLanguage as SupportedLanguage);
    }
  };

  const logout = async () => {
    await authApi.logout();
    await storage.removeItem('kharcho_cached_user_profile');
    setUser(null);
  };

  const logoutAll = async () => {
    await authApi.logoutAll();
    await storage.removeItem('kharcho_cached_user_profile');
    setUser(null);
  };

  const deleteAccount = async () => {
    await authApi.deleteMe();
    await storage.removeItem('kharcho_cached_user_profile');
    setUser(null);
  };

  const updateProfile = async (data: {
    name?: string;
    preferredLanguage?: string;
    preferredTheme?: string;
  }) => {
    const updated = await authApi.updateMe(data);
    setUser(updated);
    await storage.setItem('kharcho_cached_user_profile', JSON.stringify(updated));
    if (data.preferredLanguage) {
      await changeLanguage(data.preferredLanguage as SupportedLanguage);
    }
    if (data.preferredTheme === 'light' || data.preferredTheme === 'dark') {
      await setThemeMode(data.preferredTheme);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      await storage.setItem('kharcho_cached_user_profile', JSON.stringify(profile));
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        logoutAll,
        deleteAccount,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
