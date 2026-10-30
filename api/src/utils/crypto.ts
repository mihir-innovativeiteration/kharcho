import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * Hash password using Argon2id with OWASP-recommended parameters
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 2,
  });
}

/**
 * Verify plaintext password against Argon2id hash
 */
export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}

/**
 * Generate cryptographically secure high-entropy random token
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Compute SHA-256 hash of a token for secure database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Normalize email consistently across all authentication and storage endpoints
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
