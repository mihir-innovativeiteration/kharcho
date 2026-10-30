// Authentication & Token Management Service
import { storage } from '../storage';

const SECURE_REFRESH_TOKEN_KEY = 'kharcho_secure_refresh_token_v2';
const PERSISTED_ACCESS_TOKEN_KEY = 'kharcho_persisted_access_token_v2';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  preferredLanguage: string;
  preferredTheme: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfileData;
  tokens: AuthTokens;
}

class AuthApiClient {
  private inMemoryAccessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onUnauthorizedCallback: (() => void) | null = null;

  /**
   * Determine reachable API base URL depending on platform
   */
  getBaseUrl(): string {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    return 'https://kharcho-1.onrender.com/api/v1';
  }

  setAccessToken(token: string | null) {
    this.inMemoryAccessToken = token;
    if (token) {
      void storage.setItem(PERSISTED_ACCESS_TOKEN_KEY, token);
    } else {
      void storage.removeItem(PERSISTED_ACCESS_TOKEN_KEY);
    }
  }

  getAccessToken(): string | null {
    return this.inMemoryAccessToken;
  }

  async initStoredTokens(): Promise<string | null> {
    if (!this.inMemoryAccessToken) {
      const stored = await storage.getItem(PERSISTED_ACCESS_TOKEN_KEY);
      if (stored) {
        this.inMemoryAccessToken = stored;
      }
    }
    return this.inMemoryAccessToken;
  }

  async saveRefreshToken(token: string): Promise<void> {
    await storage.setSecureItem(SECURE_REFRESH_TOKEN_KEY, token);
  }

  async getStoredRefreshToken(): Promise<string | null> {
    return await storage.getSecureItem(SECURE_REFRESH_TOKEN_KEY);
  }

  async clearStoredSession(): Promise<void> {
    this.inMemoryAccessToken = null;
    await Promise.all([
      storage.removeSecureItem(SECURE_REFRESH_TOKEN_KEY),
      storage.removeItem(PERSISTED_ACCESS_TOKEN_KEY),
      storage.removeItem('kharcho_cached_user_profile'),
    ]);
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  private onTokenRefreshed(newToken: string) {
    this.refreshSubscribers.forEach((cb) => cb(newToken));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  /**
   * Core authenticated request wrapper with automatic token refresh
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithAuth = true
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.inMemoryAccessToken) {
      headers.Authorization = `Bearer ${this.inMemoryAccessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized by attempting a token refresh
      if (response.status === 401 && retryWithAuth) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const newTokens = await this.refreshToken();
            this.isRefreshing = false;
            this.onTokenRefreshed(newTokens.accessToken);
            return this.request<T>(endpoint, options, false);
          } catch {
            this.isRefreshing = false;
            await this.clearStoredSession();
            if (this.onUnauthorizedCallback) {
              this.onUnauthorizedCallback();
            }
            throw new Error('Session expired. Please sign in again.');
          }
        } else {
          // Wait for the active refresh request to resolve
          return new Promise<T>((resolve, reject) => {
            this.addRefreshSubscriber(async () => {
              try {
                const retryRes = await this.request<T>(endpoint, options, false);
                resolve(retryRes);
              } catch (e) {
                reject(e);
              }
            });
          });
        }
      }

      const json = await response.json();

      if (!response.ok) {
        const errorMsg = json.error || json.message || 'An unexpected error occurred';
        throw new Error(errorMsg);
      }

      return json;
    } catch (e: any) {
      if (e.message?.includes('Network request failed') || e.message?.includes('Failed to fetch')) {
        throw new Error(
          'Unable to reach Kharcho server. Please check your internet connection or backend status.'
        );
      }
      throw e;
    }
  }

  // --- Auth Endpoints ---

  async register(data: {
    name: string;
    email: string;
    password: string;
    preferredLanguage?: string;
    preferredTheme?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);

    const payload: AuthResponse = res?.data !== undefined ? res.data : res;
    this.setAccessToken(payload.tokens.accessToken);
    await this.saveRefreshToken(payload.tokens.refreshToken);
    return payload;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);

    const payload: AuthResponse = res?.data !== undefined ? res.data : res;
    this.setAccessToken(payload.tokens.accessToken);
    await this.saveRefreshToken(payload.tokens.refreshToken);
    return payload;
  }

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const res = await this.request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }, false);

    const payload: AuthResponse = res?.data !== undefined ? res.data : res;
    this.setAccessToken(payload.tokens.accessToken);
    await this.saveRefreshToken(payload.tokens.refreshToken);
    return payload;
  }

  async facebookAuth(accessToken: string): Promise<AuthResponse> {
    const res = await this.request<any>('/auth/facebook', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    }, false);

    const payload: AuthResponse = res?.data !== undefined ? res.data : res;
    this.setAccessToken(payload.tokens.accessToken);
    await this.saveRefreshToken(payload.tokens.refreshToken);
    return payload;
  }

  async refreshToken(): Promise<AuthTokens> {
    const stored = await this.getStoredRefreshToken();
    if (!stored) {
      throw new Error('No refresh token available');
    }

    const res = await this.request<any>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: stored }),
      },
      false
    );

    const tokens: AuthTokens = res?.data !== undefined ? res.data : res;
    this.setAccessToken(tokens.accessToken);
    await this.saveRefreshToken(tokens.refreshToken);
    return tokens;
  }

  async logout(): Promise<void> {
    const stored = await this.getStoredRefreshToken();
    if (stored) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: stored }),
        }, false);
      } catch {
        // Ignore remote failure during logout
      }
    }
    await this.clearStoredSession();
  }

  async logoutAll(): Promise<void> {
    try {
      await this.request('/auth/logout-all', { method: 'POST' });
    } finally {
      await this.clearStoredSession();
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }, false);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, false);
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  }

  async getMe(): Promise<UserProfileData> {
    const res = await this.request<any>('/auth/me', { method: 'GET' });
    return res?.data !== undefined ? res.data : res;
  }

  async updateMe(data: {
    name?: string;
    preferredLanguage?: string;
    preferredTheme?: string;
  }): Promise<UserProfileData> {
    const res = await this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.data !== undefined ? res.data : res;
  }

  async deleteMe(): Promise<void> {
    try {
      await this.request('/users/me', { method: 'DELETE' });
    } finally {
      await this.clearStoredSession();
    }
  }
}

export const authApi = new AuthApiClient();
