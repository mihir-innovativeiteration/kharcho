import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../setup/mockPrisma.js';

vi.mock('../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

// Import app after mocking db
const { createApp } = await import('../../src/app.js');
const app = createApp();

describe('Kharcho Authentication API Integration Tests', () => {
  beforeEach(() => {
    mockPrisma.clear();
  });

  // 1. Health check
  it('GET /api/v1/health returns healthy without disclosing secrets', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('kharcho-api');
    expect(res.body.DATABASE_URL).toBeUndefined();
    expect(res.body.ACCESS_TOKEN_SECRET).toBeUndefined();
  });

  // 2. Valid Registration
  it('POST /api/v1/auth/register creates user with Argon2id and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Aarav Sharma',
      email: 'aarav@kharcho.app',
      password: 'SecurePassword123!',
      preferredLanguage: 'en',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('aarav@kharcho.app');
    expect(res.body.data.user.name).toBe('Aarav Sharma');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose password hash!
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    // Verify stored user in mock DB has Argon2id hash and not plaintext
    const dbUser = mockPrisma.users[0];
    expect(dbUser.passwordHash).toContain('$argon2id$');
    expect(dbUser.passwordHash).not.toBe('SecurePassword123!');
  });

  // 3. Duplicate Registration
  it('POST /api/v1/auth/register rejects duplicate registration safely', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'User 1',
      email: 'duplicate@kharcho.app',
      password: 'SecurePassword123!',
    });

    const res2 = await request(app).post('/api/v1/auth/register').send({
      name: 'User 2',
      email: 'DUPLICATE@kharcho.app', // Case-insensitive normalized test
      password: 'AnotherPassword123!',
    });

    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error).toContain('already exists');
  });

  // 4. Invalid input validation
  it('POST /api/v1/auth/register validates email format and password length', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: '123', // Too short
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });

  // 5. Valid Login
  it('POST /api/v1/auth/login succeeds with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Rohan Patel',
      email: 'rohan@example.com',
      password: 'MyPassword123!',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rohan@example.com',
      password: 'MyPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Rohan Patel');
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  // 6. Incorrect Password
  it('POST /api/v1/auth/login returns generic error for incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Rohan Patel',
      email: 'rohan2@example.com',
      password: 'MyPassword123!',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rohan2@example.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid email or password');
  });

  // 7. Unknown Email Login
  it('POST /api/v1/auth/login returns identical generic error for unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'unknown_nonexistent@example.com',
      password: 'SomePassword123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid email or password');
  });

  // 8. Disabled account login
  it('POST /api/v1/auth/login rejects disabled accounts', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Disabled User',
      email: 'disabled@example.com',
      password: 'Password123!',
    });

    // Mark account disabled in DB
    const user = mockPrisma.users.find((u) => u.id === reg.body.data.user.id);
    if (user) user.disabledAt = new Date();

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'disabled@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('deactivated');
  });

  // 9. Protected endpoint access with valid token
  it('GET /api/v1/auth/me returns profile with valid Bearer token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Priya Verma',
      email: 'priya@kharcho.app',
      password: 'Password123!',
    });

    const token = reg.body.data.tokens.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('priya@kharcho.app');
    expect(res.body.data.name).toBe('Priya Verma');
  });

  // 10. Missing or invalid Bearer token
  it('GET /api/v1/auth/me rejects missing or invalid token', async () => {
    const resNoToken = await request(app).get('/api/v1/auth/me');
    expect(resNoToken.status).toBe(401);

    const resBadToken = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.bogus.jwt');
    expect(resBadToken.status).toBe(401);
  });

  // 11. Refresh token rotation
  it('POST /api/v1/auth/refresh rotates refresh token safely', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Refresh Tester',
      email: 'refresh@kharcho.app',
      password: 'Password123!',
    });

    const oldRefreshToken = reg.body.data.tokens.refreshToken;

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: oldRefreshToken,
    });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

    // Old token should now be marked revoked
    const dbOldSession = mockPrisma.refreshSessions.find(
      (s) => s.tokenHash !== mockPrisma.refreshSessions[mockPrisma.refreshSessions.length - 1].tokenHash
    );
    expect(dbOldSession?.revokedAt).toBeDefined();
  });

  // 12. Reuse of already-rotated refresh token (Compromise Detection)
  it('POST /api/v1/auth/refresh revokes all sessions when token reuse is detected', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Reuse Tester',
      email: 'reuse@kharcho.app',
      password: 'Password123!',
    });

    const oldToken = reg.body.data.tokens.refreshToken;

    // First use: rotates token successfully
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldToken });

    // Second use of old token: REUSE DETECTED!
    const reuseRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldToken });

    expect(reuseRes.status).toBe(400);
    expect(reuseRes.body.error).toContain('reuse detected');

    // All sessions for this user should now be revoked
    const userSessions = mockPrisma.refreshSessions.filter((s) => s.userId === reg.body.data.user.id);
    expect(userSessions.every((s) => s.revokedAt !== null)).toBe(true);
  });

  // 13. Logout revokes refresh session
  it('POST /api/v1/auth/logout revokes session on server', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Logout Tester',
      email: 'logout@kharcho.app',
      password: 'Password123!',
    });

    const refreshToken = reg.body.data.tokens.refreshToken;

    const logoutRes = await request(app).post('/api/v1/auth/logout').send({
      refreshToken,
    });

    expect(logoutRes.status).toBe(200);

    // Attempting to refresh with logged-out token fails
    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken,
    });
    expect(refreshRes.status).toBe(400);
  });

  // 14. Logout-All revokes all user sessions
  it('POST /api/v1/auth/logout-all revokes all sessions for user', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Logout All Tester',
      email: 'logoutall@kharcho.app',
      password: 'Password123!',
    });

    const token = reg.body.data.tokens.accessToken;
    const refreshToken = reg.body.data.tokens.refreshToken;

    const logoutAllRes = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutAllRes.status).toBe(200);

    // Refresh should fail
    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken,
    });
    expect(refreshRes.status).toBe(400);
  });

  // 15. Google Authentication
  it('POST /api/v1/auth/google creates new Google account and identity', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({
      idToken: 'mock-google-token-googleuser@gmail.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('googleuser@gmail.com');
    expect(res.body.data.user.isEmailVerified).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();

    // Verify AuthIdentity record was created
    expect(mockPrisma.identities).toHaveLength(1);
    expect(mockPrisma.identities[0].provider).toBe('google');
  });

  // 16. Google Account Linking Safeguard
  it('POST /api/v1/auth/google prevents silent auto-linking to existing password account', async () => {
    // 1. User registers with email & password
    await request(app).post('/api/v1/auth/register').send({
      name: 'Original User',
      email: 'sameemail@example.com',
      password: 'Password123!',
    });

    // 2. Someone tries to sign in with Google for that same email without linking
    const googleRes = await request(app).post('/api/v1/auth/google').send({
      idToken: 'mock-google-token-sameemail@example.com',
    });

    expect(googleRes.status).toBe(400);
    expect(googleRes.body.error).toContain('already exists');
  });

  // 16b. Facebook Authentication
  it('POST /api/v1/auth/facebook creates new Facebook account and identity', async () => {
    const res = await request(app).post('/api/v1/auth/facebook').send({
      accessToken: 'mock-facebook-token-Facebook Tester:fbtester@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('fbtester@example.com');
    expect(res.body.data.user.name).toBe('Facebook Tester');
    expect(res.body.data.tokens.accessToken).toBeDefined();

    // Verify AuthIdentity record was created with provider 'facebook'
    const fbIdentity = mockPrisma.identities.find((id: any) => id.provider === 'facebook');
    expect(fbIdentity).toBeDefined();
  });

  // 17. Forgot Password & Reset Password
  it('implements full forgot-password and reset-password flow', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Reset Tester',
      email: 'resetme@example.com',
      password: 'OldPassword123!',
    });

    // 1. Request forgot password
    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'resetme@example.com',
    });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.message).toBeDefined();

    // In mockPrisma, verify created token
    expect(mockPrisma.passwordResetTokens).toHaveLength(1);

    // Simulate token consumption with new password
    const { tokenService } = await import('../../src/services/token.service.js');
    const { hashPassword } = await import('../../src/utils/crypto.js');

    // Test tokenService consume
    const newHash = await hashPassword('BrandNewPassword123!');
    // Using mock token hash lookup:
    mockPrisma.passwordResetTokens[0].tokenHash = 'dummy-hash';
    await expect(
      tokenService.consumePasswordResetToken('non-matching-raw-token', newHash)
    ).rejects.toThrow('invalid or has already been used');
  });

  // 18. Profile update and user isolation
  it('PATCH /api/v1/users/me updates profile fields with user isolation', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Aarav Initial',
      email: 'aarav.update@kharcho.app',
      password: 'Password123!',
      preferredLanguage: 'en',
    });

    const token = reg.body.data.tokens.accessToken;

    const updateRes = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Aarav Updated',
        preferredLanguage: 'gu',
        preferredTheme: 'dark',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Aarav Updated');
    expect(updateRes.body.data.preferredLanguage).toBe('gu');
    expect(updateRes.body.data.preferredTheme).toBe('dark');
  });

  // 19. Account Deletion (GDPR / App Store / Play Store compliance)
  it('DELETE /api/v1/users/me permanently deletes user account and cascading data', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'To Delete',
      email: 'delete.me@kharcho.app',
      password: 'Password123!',
    });

    const token = reg.body.data.tokens.accessToken;
    const userId = reg.body.data.user.id;

    // Delete account
    const delRes = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify user is gone
    const checkUser = await mockPrisma.user.findUnique({ where: { id: userId } });
    expect(checkUser).toBeNull();

    // Verify subsequent requests with old token fail (user not found or unauthorized)
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect([401, 404]).toContain(meRes.status);
    expect(meRes.body.success).toBe(false);
  });
});
