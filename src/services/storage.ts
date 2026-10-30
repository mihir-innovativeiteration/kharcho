import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  /**
   * Save general non-sensitive preferences (e.g. theme preference, onboarding flag)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage setItem failed:', e);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage removeItem failed:', e);
    }
  },

  /**
   * Native SecureStore for tokens / sensitive auth keys with resilient AsyncStorage fallback
   */
  async setSecureItem(key: string, value: string): Promise<void> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(`secure_${sanitizedKey}`, value);
        return;
      }
      await SecureStore.setItemAsync(sanitizedKey, value);
      // Secondary fallback cache
      await AsyncStorage.setItem(`secure_${sanitizedKey}`, value);
    } catch (e) {
      console.warn('SecureStore setItemAsync failed, using AsyncStorage fallback:', e);
      await AsyncStorage.setItem(`secure_${sanitizedKey}`, value);
    }
  },

  async getSecureItem(key: string): Promise<string | null> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(`secure_${sanitizedKey}`);
      }
      const val = await SecureStore.getItemAsync(sanitizedKey);
      if (val !== null && val !== undefined) {
        return val;
      }
      return await AsyncStorage.getItem(`secure_${sanitizedKey}`);
    } catch {
      return await AsyncStorage.getItem(`secure_${sanitizedKey}`);
    }
  },

  async removeSecureItem(key: string): Promise<void> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(sanitizedKey);
      }
    } catch (e) {
      console.warn('SecureStore deleteItemAsync error:', e);
    }
    await AsyncStorage.removeItem(`secure_${sanitizedKey}`);
  },
};
