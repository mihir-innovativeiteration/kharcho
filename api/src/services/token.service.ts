import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';
import { generateAccessToken } from '../utils/jwt.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export class TokenService {
  /**
   * Create a new refresh session and issue accessToken + refreshToken pair
   */
  async createSession(userId: string, email: string, name: string, deviceInfo?: string): Promise<TokenPair> {
    const rawRefreshToken = generateRandomToken(40);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);

    await prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        deviceInfo,
      },
    });

    const accessToken = generateAccessToken({ sub: userId, email, name });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.ACCESS_TOKEN_TTL,
    };
  }

  /**
   * Rotate a refresh token: consume old token and issue a fresh pair.
   * If reuse of an already revoked token is detected, revokes all user sessions as a security precaution.
   */
  async rotateRefreshToken(rawRefreshToken: string, deviceInfo?: string): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new Error('Invalid refresh token');
    }

    // Check if token was already revoked (Reuse Detection)
    if (session.revokedAt) {
      // Possible compromise: Revoke all active sessions for this user
      await prisma.refreshSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new Error('Refresh token reuse detected. All sessions revoked for security.');
    }

    // Check if token expired
    if (new Date() > session.expiresAt) {
      throw new Error('Refresh token expired');
    }

    // Check if user is disabled
    if (session.user.disabledAt) {
      throw new Error('User account is deactivated');
    }

    // Generate new token pair and atomically revoke old session
    const newRawRefreshToken = generateRandomToken(40);
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);

    await prisma.$transaction([
      prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      }),
      prisma.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
          deviceInfo: deviceInfo || session.deviceInfo,
        },
      }),
    ]);

    const accessToken = generateAccessToken({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: env.ACCESS_TOKEN_TTL,
    };
  }

  /**
   * Revoke a single refresh token session (Logout)
   */
  async revokeSession(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh sessions for a user (Logout All)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Create an email verification token (valid for 24h)
   */
  async createVerificationToken(userId: string): Promise<string> {
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Consume an email verification token
   */
  async consumeVerificationToken(rawToken: string): Promise<string> {
    const tokenHash = hashToken(rawToken);

    const record = await prisma.verificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.consumedAt) {
      throw new Error('Verification link is invalid or has already been used');
    }

    if (new Date() > record.expiresAt) {
      throw new Error('Verification link has expired. Please request a new one.');
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return record.userId;
  }

  /**
   * Create a password reset token (valid for 1h)
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Consume a password reset token and update the user's password hash
   */
  async consumePasswordResetToken(rawToken: string, newPasswordHash: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.consumedAt) {
      throw new Error('Password reset token is invalid or has already been used');
    }

    if (new Date() > record.expiresAt) {
      throw new Error('Password reset token has expired. Please request a new one.');
    }

    // Atomically consume token, update password, and revoke all existing sessions
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.refreshSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}

export const tokenService = new TokenService();
