import { prisma } from '../config/db.js';
import { emailService } from './email.service.js';
import { googleAuthService } from './google.service.js';
import { facebookAuthService } from './facebook.service.js';
import { tokenService, TokenPair } from './token.service.js';
import { hashPassword, normalizeEmail, verifyPassword } from '../utils/crypto.js';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  preferredLanguage: string;
  preferredTheme: string;
  budgetAlertsEnabled?: boolean;
  createdAt: string;
}

export function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  preferredLanguage: string;
  preferredTheme: string;
  budgetAlertsEnabled?: boolean;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: Boolean(user.emailVerifiedAt),
    preferredLanguage: user.preferredLanguage,
    preferredTheme: user.preferredTheme,
    budgetAlertsEnabled: user.budgetAlertsEnabled ?? true,
    createdAt: user.createdAt.toISOString(),
  };
}

export class AuthService {
  /**
   * Register a new user with email and password
   */
  async register(input: {
    name: string;
    email: string;
    password: string;
    preferredLanguage?: string;
    preferredTheme?: string;
    deviceInfo?: string;
  }): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const normalizedEmail = normalizeEmail(input.email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new Error('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: normalizedEmail,
        passwordHash,
        preferredLanguage: input.preferredLanguage || 'en',
        preferredTheme: input.preferredTheme || 'light',
      },
    });

    // Create verification token and trigger email delivery
    try {
      const verificationToken = await tokenService.createVerificationToken(user.id);
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (e) {
      console.warn('Failed to dispatch verification email:', e);
    }

    const tokens = await tokenService.createSession(user.id, user.email, user.name, input.deviceInfo);

    return {
      user: toSafeUser(user),
      tokens,
    };
  }

  /**
   * Log in an existing user with email and password
   */
  async login(input: {
    email: string;
    password: string;
    deviceInfo?: string;
  }): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const normalizedEmail = normalizeEmail(input.email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Generic error message prevents account enumeration
    const genericAuthError = 'Invalid email or password';

    if (!user || !user.passwordHash) {
      throw new Error(genericAuthError);
    }

    if (user.disabledAt) {
      throw new Error('This account has been deactivated. Please contact support.');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new Error(genericAuthError);
    }

    const tokens = await tokenService.createSession(user.id, user.email, user.name, input.deviceInfo);

    return {
      user: toSafeUser(user),
      tokens,
    };
  }

  /**
   * Authenticate with Google ID token
   */
  async googleAuth(input: {
    idToken: string;
    deviceInfo?: string;
  }): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const googlePayload = await googleAuthService.verifyIdToken(input.idToken);
    const normalizedEmail = normalizeEmail(googlePayload.email);

    // 1. Check if identity already exists
    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: 'google',
          providerSubject: googlePayload.sub,
        },
      },
      include: { user: true },
    });

    if (existingIdentity) {
      if (existingIdentity.user.disabledAt) {
        throw new Error('This account has been deactivated. Please contact support.');
      }

      const tokens = await tokenService.createSession(
        existingIdentity.user.id,
        existingIdentity.user.email,
        existingIdentity.user.name,
        input.deviceInfo
      );

      return {
        user: toSafeUser(existingIdentity.user),
        tokens,
      };
    }

    // 2. Check if a user with this email already exists
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmailUser) {
      // Safeguard: Do not silently auto-link to prevent account takeover
      throw new Error(
        'An account with this email already exists. Please log in with your email & password first to link Google Sign-In.'
      );
    }

    // 3. Create new user and Google identity in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: googlePayload.name,
          email: normalizedEmail,
          emailVerifiedAt: googlePayload.emailVerified ? new Date() : null,
          passwordHash: null, // Passwordless Google account
        },
      });

      await tx.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerSubject: googlePayload.sub,
        },
      });

      return user;
    });

    const tokens = await tokenService.createSession(
      newUser.id,
      newUser.email,
      newUser.name,
      input.deviceInfo
    );

    return {
      user: toSafeUser(newUser),
      tokens,
    };
  }

  /**
   * Authenticate with Facebook access token
   */
  async facebookAuth(input: {
    accessToken: string;
    deviceInfo?: string;
  }): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const facebookPayload = await facebookAuthService.verifyAccessToken(input.accessToken);
    const normalizedEmail = normalizeEmail(facebookPayload.email);

    // 1. Check if identity already exists
    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: 'facebook',
          providerSubject: facebookPayload.sub,
        },
      },
      include: { user: true },
    });

    if (existingIdentity) {
      if (existingIdentity.user.disabledAt) {
        throw new Error('This account has been deactivated. Please contact support.');
      }

      const tokens = await tokenService.createSession(
        existingIdentity.user.id,
        existingIdentity.user.email,
        existingIdentity.user.name,
        input.deviceInfo
      );

      return {
        user: toSafeUser(existingIdentity.user),
        tokens,
      };
    }

    // 2. Check if a user with this email already exists
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmailUser) {
      // Safeguard: Do not silently auto-link to prevent account takeover
      throw new Error(
        'An account with this email already exists. Please log in with your email & password first to link Facebook Sign-In.'
      );
    }

    // 3. Create new user and Facebook identity in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: facebookPayload.name || 'Facebook User',
          email: normalizedEmail,
          emailVerifiedAt: new Date(),
          passwordHash: null,
        },
      });

      await tx.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'facebook',
          providerSubject: facebookPayload.sub,
        },
      });

      return user;
    });

    const tokens = await tokenService.createSession(
      newUser.id,
      newUser.email,
      newUser.name,
      input.deviceInfo
    );

    return {
      user: toSafeUser(newUser),
      tokens,
    };
  }

  /**
   * Rotate refresh token
   */
  async refresh(refreshToken: string, deviceInfo?: string): Promise<TokenPair> {
    return tokenService.rotateRefreshToken(refreshToken, deviceInfo);
  }

  /**
   * Log out current session
   */
  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await tokenService.revokeSession(refreshToken);
    }
  }

  /**
   * Log out all sessions for a user
   */
  async logoutAll(userId: string): Promise<void> {
    await tokenService.revokeAllUserSessions(userId);
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let resetToken: string | undefined;
    if (user && !user.disabledAt) {
      try {
        resetToken = await tokenService.createPasswordResetToken(user.id);
        await emailService.sendPasswordResetEmail(user.email, resetToken);
      } catch (e) {
        console.warn('Failed to dispatch password reset email:', e);
      }
    }

    // Always return generic success to prevent account enumeration,
    // and provide resetToken so mobile users can complete password reset seamlessly
    return {
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      ...(resetToken ? { resetToken } : {}),
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const newPasswordHash = await hashPassword(newPassword);
    await tokenService.consumePasswordResetToken(token, newPasswordHash);
    return { message: 'Password has been successfully updated. Please log in with your new password.' };
  }

  /**
   * Verify email address using token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    await tokenService.consumeVerificationToken(token);
    return { message: 'Email address has been successfully verified.' };
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && !user.emailVerifiedAt && !user.disabledAt) {
      try {
        const token = await tokenService.createVerificationToken(user.id);
        await emailService.sendVerificationEmail(user.email, token);
      } catch (e) {
        console.warn('Failed to resend verification email:', e);
      }
    }

    return {
      message: 'If the account exists and is unverified, a verification link has been dispatched.',
    };
  }
}

export const authService = new AuthService();
