# Kharcho Authentication System

Phase 2 introduces a production-grade, secure authentication system designed for cross-platform Android and iOS usage with a dedicated Node.js + Express + Prisma + MySQL backend.

---

## 1. System Architecture

The authentication system employs a modern, dual-token architecture (Short-Lived Access Tokens + Rotated Revocable Refresh Sessions):

```
┌────────────────────────────────────────────────────────┐
│               Kharcho Mobile (React Native)           │
│                                                        │
│  - In-Memory Access Token Storage (XSS/Memory-only)    │
│  - Expo SecureStore for Refresh Token (Keychain/KeyStore│
│  - Axios/Fetch Queue for 401 Silent Token Refresh      │
└──────────────────────────┬─────────────────────────────┘
                           │
                 HTTPS JSON Requests
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Node.js Express Backend                │
│                                                        │
│  - Helmet, Strict CORS, IP-based Rate Limiters         │
│  - Zod Request DTO Validation                          │
│  - Argon2id Password Hashing (OWASP recommended)       │
│  - Google ID Token Signature Verification              │
│  - Cryptographic SHA-256 Token Session Lookup          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                    MySQL Database                      │
│                                                        │
│  - User & AuthIdentity (Email, Google, Multi-provider) │
│  - RefreshSession (Hashed tokens, device, family)      │
│  - VerificationToken & PasswordResetToken (Single-use) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Token Lifecycle & Session Management

### Short-Lived Access Tokens
- **Algorithm**: HMAC SHA-256 (`HS256`).
- **Validity**: 15 minutes (`15m`).
- **Payload**:
  ```json
  {
    "sub": "user_cly0123456789",
    "email": "user@example.com",
    "iat": 1710000000,
    "exp": 1710000900
  }
  ```
- **Storage**: Kept strictly **in-memory** in the mobile app runtime. Never written to insecure persistent storage (AsyncStorage/localStorage).

### Rotated Refresh Tokens
- **Format**: 64-character high-entropy cryptographic hex string (`crypto.randomBytes(32).toString('hex')`).
- **Validity**: 30 days (`30d`).
- **Database Storage**: The raw token is **never stored** in the database. Only its cryptographic hash (`SHA-256(rawToken)`) is persisted in the `refresh_sessions` table.
- **Client Storage**: Persisted in hardware-backed secure storage using **`expo-secure-store`** (iOS Keychain / Android EncryptedSharedPreferences).
- **Rotation with Reuse Detection**:
  - Every time `/api/v1/auth/refresh` is called with a valid refresh token, the server revokes the old session (`revokedAt = NOW()`) and issues a brand-new token pair.
  - **Replay Protection**: If a previously revoked refresh token is presented to the refresh endpoint, the system detects a potential replay/hijack attack, immediately flags the session family, and **revokes all active sessions** for that user.

---

## 3. Supported Authentication Providers

### 1. Email & Password
- **Registration (`POST /api/v1/auth/register`)**:
  - Requires: `name`, `email`, `password`.
  - Passwords hashed using **Argon2id** (`type: argon2id`, `memoryCost: 65536`, `timeCost: 3`).
  - Creates a local `AuthIdentity` with `provider = "EMAIL"`.
  - Dispatches an email verification token.
- **Login (`POST /api/v1/auth/login`)**:
  - Authenticates email and password.
  - Returns user profile, access token, and refresh token.

### 2. Google Sign-In
- **Native / Web Flow (`POST /api/v1/auth/google`)**:
  - Mobile client initiates Google Sign-In via `expo-auth-session` / Google Identity.
  - Client retrieves Google `idToken` and transmits it to backend.
  - Backend verifies cryptographic signature using `google-auth-library` against Google's public JWKS certificates and configured `GOOGLE_CLIENT_ID`.
  - If the user does not exist, an account is created with `isEmailVerified = true`.
  - If a user exists with email/password, a linked `AuthIdentity` (`provider = "GOOGLE"`) is attached to the existing user.

---

## 4. Account Lifecycle Flows

### Forgot & Reset Password
1. **Request (`POST /api/v1/auth/forgot-password`)**:
   - Generates a cryptographically random, single-use token (valid 1 hour).
   - Only the SHA-256 hash is saved in `password_reset_tokens`.
   - Sends reset link via `ConsoleEmailService` / production SMTP.
   - Response is identical whether the email exists or not (anti-enumeration).
2. **Reset (`POST /api/v1/auth/reset-password`)**:
   - Validates the token and expiration.
   - Updates password with new Argon2id hash.
   - Marks token as `usedAt = NOW()`.
   - **Revokes all existing sessions** across all devices to prevent unauthorized access.

### Email Verification
1. **Verification (`POST /api/v1/auth/verify-email`)**:
   - Validates token against `verification_tokens`.
   - Marks token as used and sets `isEmailVerified = true` on the User record.
2. **Resend (`POST /api/v1/auth/resend-verification`)**:
   - Generates a new single-use token and invalidates previous pending tokens.

### Logout
- **Current Device (`POST /api/v1/auth/logout`)**:
  - Revokes current refresh token hash in `refresh_sessions`.
  - Mobile clears SecureStore and in-memory access token.
- **All Devices (`POST /api/v1/auth/logout-all`)**:
  - Revokes all active refresh sessions for the authenticated user.

---

## 5. API Endpoints Reference

All endpoints prefixed with `/api/v1`:

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register new email/password account |
| `POST` | `/auth/login` | No | Login with email/password |
| `POST` | `/auth/google` | No | Authenticate via Google ID token |
| `POST` | `/auth/refresh` | No | Rotate refresh token & obtain new access token |
| `POST` | `/auth/logout` | No (Requires Refresh Token) | Revoke current session |
| `POST` | `/auth/logout-all` | Yes (Bearer Token) | Revoke all sessions for user |
| `POST` | `/auth/forgot-password` | No | Request password reset token |
| `POST` | `/auth/reset-password` | No | Set new password with token |
| `POST` | `/auth/verify-email` | No | Confirm email address with token |
| `POST` | `/auth/resend-verification` | No | Resend verification email |
| `GET` | `/users/me` | Yes (Bearer Token) | Get current user profile |
| `PATCH` | `/users/me` | Yes (Bearer Token) | Update profile (name, currency, locale, theme) |
| `GET` | `/health` | No | Health check |
