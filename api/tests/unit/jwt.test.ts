import { describe, expect, it } from 'vitest';
import { generateAccessToken, verifyAccessToken } from '../../src/utils/jwt.js';

describe('JWT Access Token Service', () => {
  it('generates a valid signed JWT access token and decodes it', () => {
    const payload = {
      sub: 'user_uuid_12345',
      email: 'aarav@example.com',
      name: 'Aarav Sharma',
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
    expect(decoded.iss).toBe('kharcho-api');
    expect(decoded.aud).toBe('kharcho-mobile');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('rejects tampered or malformed tokens', () => {
    const valid = generateAccessToken({ sub: 'u1', email: 'u1@test.com', name: 'User 1' });
    const tampered = valid.substring(0, valid.length - 5) + 'xxxxx';

    expect(() => verifyAccessToken(tampered)).toThrow();
    expect(() => verifyAccessToken('totally.invalid.token')).toThrow();
  });
});
