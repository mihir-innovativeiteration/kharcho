# Kharcho Security Threat Model & Production Hardening Report

## 1. Executive Summary

Kharcho is a multi-tenant personal finance application handling sensitive monetary data (incomes, expenses, budgets, savings goals, recurring liabilities, and AI entry drafts).
As part of **Phase 9: Production Readiness, Security Audit & Optimization**, a comprehensive STRIDE threat modeling assessment and penetration-style audit was conducted across mobile and backend tiers.

All critical attack surfaces have been fortified with defense-in-depth controls, proven through automated regression and cross-tenant isolation test suites (160 passing tests).

---

## 2. STRIDE Threat Model & Defense Matrix

| Threat Category | Potential Attack Vector | Impact | Implemented Mitigation / Control | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Forged user identities, stolen JWT tokens, fake Google OAuth logins | Unauthorized account access | • Asymmetric Google token verification (`google-auth-library`) with audience validation (`client_id`).<br>• Short-lived JWT access tokens (15m expiry).<br>• Cryptographically secure, hashed refresh tokens (`sha256`) stored in database.<br>• Session revocation on logout & password reset. | `tests/integration/auth.test.ts`<br>`tests/unit/google.test.ts` |
| **Tampering** | Parameter manipulation, IDOR mutation of other users' records, floating-point ledger corruption | Ledger corruption, unauthorized data modification | • Strict multi-tenant isolation where every database query filters by `userId`.<br>• Arbitrary Precision Arithmetic using `@prisma/client` `Decimal` (`Decimal(19,4)` in MySQL).<br>• Idempotent `clientMutationId` and `operationId` on all write and sync operations.<br>• Argon2id password hashing with unique salts. | `tests/integration/security_isolation.test.ts`<br>`tests/unit/financial_integrity.test.ts` |
| **Repudiation** | Denying transaction creations or sync modifications | Audit failure, ledger dispute | • Every HTTP request is tagged with an immutable `X-Request-Id` correlation UUID.<br>• Durable `SyncReceipt` ledger tracking client-server reconciliation.<br>• Client mutation timestamps and versioned optimistic concurrency tracking. | `tests/integration/security_isolation.test.ts`<br>`tests/integration/sync.test.ts` |
| **Information Disclosure** | Cross-tenant data leakage (IDOR), leaking database errors or stack traces, committing secrets | PII breach, financial confidentiality loss | • Zero stack traces or raw database/SQL messages exposed in HTTP error responses.<br>• Strict `.gitignore` protecting `.env`, `api/.env`, and keystores.<br>• Secrets and API keys (`GEMINI_API_KEY`) isolated strictly to backend server environment.<br>• Error handlers sanitize sensitive fields (`password`, `token`, `authorization`). | `tests/middleware/error.middleware.ts`<br>`.gitignore` audit |
| **Denial of Service (DoS)** | Brute force password guessing, API flooding, memory exhaustion via huge JSON payloads | Service degradation or downtime | • Tiered rate limiting via `express-rate-limit` (strict 10 req/15m for auth, 200 req/15m general).<br>• Safe JSON body parsing size ceilings (`limit: '1mb'`).<br>• Safe ceiling on single transactions (`100,000,000,000.00 INR`). | `tests/integration/auth.test.ts`<br>`api/src/utils/money.ts` |
| **Elevation of Privilege** | Normal user mutating system categories or executing scheduler admin tasks | System integrity compromise | • Separation of user-owned resources from immutable `isSystem` categories and payment methods.<br>• User cannot delete or modify system categories (`isSystem: true`).<br>• Strict tenant boundaries enforced via JWT identity injection (`req.user.id`). | `tests/integration/categories_paymentMethods.test.ts` |

---

## 3. Findings & Remediations Log

### Finding SEC-001 (High): Potential Secret Exposure in Root `.gitignore`
- **Component**: Root repository configuration (`.gitignore`)
- **Vulnerability**: Previous rule only ignored `.env*.local`. A developer placing `.env` in root or `api/.env` could have accidentally tracked secrets into git.
- **Remediation**: Updated `.gitignore` to explicitly ignore `.env`, `.env.*`, `api/.env`, `api/dist`, `coverage`, and certificate files (`*.pem`, `*.jks`, `*.key`), while whitelisting `.env.example` templates.
- **Verification**: Verified via `git status --ignored` that `api/.env` is reliably ignored.

### Finding SEC-002 (Medium): Request Correlation Tracing & Error Information Leakage
- **Component**: Backend HTTP Pipeline & Error Middleware
- **Vulnerability**: Unhandled exceptions could have emitted verbose internal details in responses; lack of `X-Request-Id` hindered audit tracing across distributed logs.
- **Remediation**: Implemented `requestIdMiddleware` attaching `req.id` / `X-Request-Id` to all requests and responses. Updated `errorHandler` to mask Prisma/SQL details and return sanitized error envelopes including `{ requestId }`.
- **Verification**: Verified via `tests/integration/security_isolation.test.ts`.

### Finding SEC-003 (High): Multi-Tenant Cross-User Resource Isolation (IDOR)
- **Component**: Transactions, Budgets, Savings Goals, Recurring Rules, In-App Reminders, and Sync
- **Vulnerability**: Risk of User B accessing or altering User A's financial data by guessing or manipulating resource UUIDs.
- **Remediation**: Enforced `where: { id: resourceId, userId }` on every database read, update, delete, and outbox sync mutation.
- **Verification**: Created 16 dedicated cross-user authorization tests in `tests/integration/security_isolation.test.ts` proving User B receives 403/404 on all attempts to access User A's data.

### Finding SEC-004 (Critical): Floating-Point Imprecision in Financial Summation
- **Component**: Money utilities & Financial summary calculation
- **Vulnerability**: Standard JavaScript binary floating-point math (`0.1 + 0.2 === 0.30000000000000004`) causes rounding drift and ledger inaccuracies over high transaction counts.
- **Remediation**: All monetary calculations utilize Prisma's arbitrary-precision `Decimal` type (`Decimal(19,4)` storage, strictly formatted to 2 decimal places for INR presentation). Zero, negative, and scientific notation inputs are strictly rejected.
- **Verification**: Verified via `tests/unit/financial_integrity.test.ts` across 10,000 transaction iterations with 0.00 drift.

### Finding SEC-005 (Medium): AI Feature Isolation & Financial Ledger Safety
- **Component**: AI Natural Language Expense Parser
- **Vulnerability**: Risk of hallucinated or partial AI entries directly writing to user transactions without human confirmation.
- **Remediation**: The AI endpoint (`/api/v1/ai/transactions/parse`) is strictly read-only: it generates candidate drafts in memory and writes ZERO records to the database. Creation only occurs when the user explicitly reviews and confirms the draft.
- **Verification**: Verified in `tests/integration/e2e_journey.test.ts` (Scenario 7 & 8).

---

## 4. Cryptographic Standards Summary

- **Passwords**: Argon2id via `argon2` with high memory/time cost parameters.
- **JWT Signing**: HMAC-SHA256 with minimum 256-bit (32 character) secret.
- **Refresh Tokens**: Opaque 64-character random hex strings, stored only as `SHA-256` hashes in database.
- **OAuth Identity**: Google token integrity verified using Google's public JWKS keys.
- **Database Precision**: `Decimal(19, 4)` for all currency fields in MySQL.
