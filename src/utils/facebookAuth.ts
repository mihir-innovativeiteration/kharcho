import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

/**
 * Prompt user for Facebook OAuth Sign-In and return Facebook Access Token
 */
export async function promptFacebookSignIn(): Promise<string> {
  // If no live Facebook App ID is configured in development, provide development simulation token
  if (!FACEBOOK_APP_ID) {
    return 'mock-facebook-token-Mihir Gola:themihir12@gmail.com';
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'kharcho',
    path: 'auth/facebook-callback',
  });

  const request = new AuthSession.AuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
    responseType: AuthSession.ResponseType.Token,
    redirectUri,
  });

  const discovery = {
    authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
  };

  const result = await request.promptAsync(discovery);

  if (result.type === 'success' && result.params.access_token) {
    return result.params.access_token;
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Facebook Sign-In was cancelled');
  }

  throw new Error('Unable to complete Facebook Sign-In. Please check your network and configuration.');
}
