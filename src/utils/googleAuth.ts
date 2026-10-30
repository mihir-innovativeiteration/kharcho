import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs (configurable via environment variables)
const GOOGLE_CLIENT_ID =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  }) || 'mock-google-client-id.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Prompt user for Google OAuth Sign-In and return Google ID Token
 */
export async function promptGoogleSignIn(): Promise<string> {
  // If no live client ID is configured in development, provide a development simulation token
  // that the backend's development mock handler safely validates
  if (
    !process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID &&
    !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID &&
    !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  ) {
    // In local development / emulator without live Google Cloud project configured:
    return 'mock-google-token-Mihir Gola:themihir12@gmail.com';
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'kharcho',
    path: 'auth/google-callback',
  });

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.IdToken,
    redirectUri,
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'success' && result.params.id_token) {
    return result.params.id_token;
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google Sign-In was cancelled');
  }

  throw new Error('Unable to complete Google Sign-In. Please check your network and configuration.');
}
