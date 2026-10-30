import crypto from 'crypto';
import { env } from '../config/env.js';

export interface FacebookUserPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export class FacebookAuthService {
  /**
   * Verify Facebook access token via Graph API or dev mock token
   */
  async verifyAccessToken(accessToken: string): Promise<FacebookUserPayload> {
    // In test/development environment, support deterministic simulation token
    if ((env.NODE_ENV === 'test' || env.NODE_ENV === 'development') && accessToken.startsWith('mock-facebook-token-')) {
      const tokenBody = accessToken.replace('mock-facebook-token-', '');
      const [parsedName, parsedEmail] = tokenBody.includes(':')
        ? tokenBody.split(':')
        : ['Facebook User', tokenBody];
      const email = parsedEmail || tokenBody || 'facebook.user@kharcho.app';
      const name = parsedName || 'Facebook User';
      return {
        sub: `facebook_sub_${email}`,
        email,
        emailVerified: true,
        name,
      };
    }

    // Call Facebook Graph API /me endpoint
    let url = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(
      accessToken
    )}`;

    // If app secret is set, add appsecret_proof for enhanced security
    if (env.FACEBOOK_APP_SECRET) {
      const hmac = crypto.createHmac('sha256', env.FACEBOOK_APP_SECRET);
      hmac.update(accessToken);
      const proof = hmac.digest('hex');
      url += `&appsecret_proof=${proof}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || 'Invalid Facebook access token';
      throw new Error(`Facebook authentication failed: ${errorMsg}`);
    }

    if (!data.id) {
      throw new Error('Facebook user ID is missing from response');
    }

    // Fallback email if user didn't grant email or signed up with mobile number only
    const email = data.email || `${data.id}@facebook.kharcho.app`;
    const name = data.name || 'Facebook User';
    const picture = data.picture?.data?.url;

    return {
      sub: data.id,
      email,
      emailVerified: Boolean(data.email),
      name,
      picture,
    };
  }
}

export const facebookAuthService = new FacebookAuthService();
