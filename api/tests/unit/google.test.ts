import { describe, expect, it } from 'vitest';
import { googleAuthService } from '../../src/services/google.service.js';

describe('Google Authentication Service', () => {
  it('safely verifies mock Google tokens in test environment', async () => {
    const mockToken = 'mock-google-token-testuser@gmail.com';
    const payload = await googleAuthService.verifyIdToken(mockToken);

    expect(payload.email).toBe('testuser@gmail.com');
    expect(payload.sub).toBe('google_sub_testuser@gmail.com');
    expect(payload.emailVerified).toBe(true);
    expect(payload.name).toBe('Google User');
  });

  it('rejects invalid or non-mock token when client IDs are not configured', async () => {
    await expect(googleAuthService.verifyIdToken('invalid-real-token')).rejects.toThrow();
  });
});
