# Kharcho Security & Protection Guide

This document outlines the security architecture and defensive controls implemented across Kharcho's mobile client and backend.

---

## 1. Password Security: Argon2id

- **OWASP Best Practice**: Argon2id is the winner of the Password Hashing Competition (PHC) and the OWASP-recommended algorithm for credentials, providing resistance to GPU, ASIC, and side-channel timing attacks.
- **Parameters**:
  - Algorithm: `argon2id`
  - Memory Cost: `65,536 KB` (64 MB)
  - Time Cost: `3` iterations
  - Parallelism: `1` thread
- **Timing Attack Mitigation**: When login fails due to a non-existent email, the backend executes a dummy Argon2id verification to equalize response timing, neutralizing user enumeration through side-channel latency profiling.

---

## 2. Refresh Token Storage & Key Protection

- **Client-Side (Mobile)**:
  - Access tokens are kept **purely in runtime memory**, minimizing exposure to storage attacks.
  - Refresh tokens are stored using **`expo-secure-store`**:
    - **iOS**: Uses the native **iOS Keychain** with `kSecAttrAccessibleAfterFirstUnlock`.
    - **Android**: Uses the **Android KeyStore** backed by hardware security modules (TEE/SE) and `EncryptedSharedPreferences`.
- **Server-Side (Database)**:
  - Cleartext refresh tokens are **never written to disk**.
  - Only `SHA-256(rawToken)` is stored in `refresh_sessions.token_hash`.
  - A compromised database dump will not grant attackers access to active user sessions.

---

## 3. Session Rotation & Reuse Detection

- On every call to `/api/v1/auth/refresh`, the submitted refresh token is permanently revoked (`revokedAt = NOW()`), and a brand-new refresh token and session ID are minted.
- **Token Hijacking Detection**:
  - If a refresh token is reused after it has already been revoked, the system assumes the token was intercepted by an attacker.
  - The backend immediately flags the violation, logs a security warning, and **revokes all active sessions** for the associated user account.
  - The legitimate user must re-authenticate, closing the window of vulnerability.

---

## 4. Rate Limiting & Denial of Service Defense

- Express rate limiters are applied globally and specifically to sensitive auth endpoints:
  - **Auth Rate Limiter (`/api/v1/auth/*`)**: 10 requests per 15-minute window per IP.
  - **General API Limiter (`/api/v1/*`)**: 100 requests per 15-minute window per IP.
  - Standard headers returned: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
  - Standard HTTP `429 Too Many Requests` returned when thresholds are exceeded.

---

## 5. Input Validation & Injection Defense

- **Zod Schemas**: Strict DTO validation on all incoming request bodies.
  - Invalid types, extra malicious fields, or malformed data are rejected with HTTP 400 before hitting business logic.
- **Prisma Parameterized Queries**: All database interactions use Prisma ORM with parameterized SQL queries, eliminating SQL injection vectors.
- **Email Normalization**: All incoming email addresses are trimmed and lowercased (`email.trim().toLowerCase()`) to prevent duplicate accounts via casing discrepancies.

---

## 6. HTTP Headers & Transport Layer

- **Helmet**: Secures HTTP response headers:
  - `Content-Security-Policy`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security` (HSTS)
  - `X-XSS-Protection`
- **CORS Configuration**: Restricts access to authorized mobile origins and web origins defined in `CORS_ORIGIN`.
- **TLS/HTTPS**: All production traffic must pass over TLS 1.3.

---

## 7. Password Reset & Verification Security

- Single-use, cryptographically secure tokens (`crypto.randomBytes(32)`).
- Verification tokens expire in 24 hours.
- Password reset tokens expire in 1 hour.
- Password reset automatically invalidates **all active sessions** on all devices.
- Non-enumerating responses: `/forgot-password` returns success even if an email is not registered.
