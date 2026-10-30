import { describe, expect, it } from 'vitest';
import { generateRandomToken, hashPassword, hashToken, normalizeEmail, verifyPassword } from '../../src/utils/crypto.js';

describe('Crypto & Security Utilities', () => {
  it('normalizes emails correctly (lowercase and trim)', () => {
    expect(normalizeEmail('  Aarav.Sharma@Example.COM  ')).toBe('aarav.sharma@example.com');
    expect(normalizeEmail('USER@TEST.IN')).toBe('user@test.in');
  });

  it('hashes passwords using Argon2id and verifies them', async () => {
    const raw = 'StrongPassphrase!2026';
    const hash = await hashPassword(raw);

    expect(hash).toContain('$argon2id$');
    expect(hash).not.toBe(raw);

    const isMatch = await verifyPassword(hash, raw);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword(hash, 'WrongPassword123');
    expect(isWrong).toBe(false);
  });

  it('generates high-entropy random tokens of expected length', () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);

    expect(token1).toHaveLength(64); // 32 bytes hex = 64 chars
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('computes deterministic SHA-256 token hash for database storage', () => {
    const token = 'sample-random-bearer-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });
});
