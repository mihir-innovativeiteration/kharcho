import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';

export interface GoogleUserPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export class GoogleAuthService {
  private client: OAuth2Client;
  private allowedAudiences: string[];

  constructor() {
    this.client = new OAuth2Client();
    this.allowedAudiences = [
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_ANDROID_CLIENT_ID,
      env.GOOGLE_IOS_CLIENT_ID,
      env.GOOGLE_WEB_CLIENT_ID,
    ].filter(Boolean);
  }

  /**
   * Verify Google ID token and extract user claims safely
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserPayload> {
    // In test/development environment, support deterministic simulation token for automated tests and local client testing
    if ((env.NODE_ENV === 'test' || env.NODE_ENV === 'development') && idToken.startsWith('mock-google-token-')) {
      const tokenBody = idToken.replace('mock-google-token-', '');
      const [parsedName, parsedEmail] = tokenBody.includes(':')
        ? tokenBody.split(':')
        : ['Google User', tokenBody];
      const email = parsedEmail || tokenBody || 'themihir12@gmail.com';
      const name = parsedName || 'Google User';
      return {
        sub: `google_sub_${email}`,
        email,
        emailVerified: true,
        name,
      };
    }

    if (this.allowedAudiences.length === 0) {
      throw new Error('Google OAuth client IDs are not configured on the server');
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.allowedAudiences,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Google token payload is empty');
    }

    const issuer = payload.iss;
    if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
      throw new Error(`Invalid Google token issuer: ${issuer}`);
    }

    if (!payload.email) {
      throw new Error('Google token does not contain a verified email address');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: Boolean(payload.email_verified),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    };
  }
}

export const googleAuthService = new GoogleAuthService();
