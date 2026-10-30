# Kharcho Phase 2 Verification Checklist

## 1. Mobile Client Implementation (React Native & Expo SDK 58)

- [x] **Sign-in Screen (`src/app/(auth)/sign-in.tsx`)**
  - Kharcho branding and visual identity preserved
  - Email & password inputs with show/hide password toggle
  - Google Sign-In button with official styling and SVG branding
  - Forgot password and Create Account navigation links
  - Form validation with accessible error messages
  - Keyboard avoiding view and safe-area compatibility
- [x] **Sign-up Screen (`src/app/(auth)/sign-up.tsx`)**
  - Full Name, Email, Password, and Confirm Password fields
  - Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
  - Password match confirmation check
  - Only valid payload fields dispatched to backend
  - Google Sign-In quick option
- [x] **Forgot-Password Screen (`src/app/(auth)/forgot-password.tsx`)**
  - Email input with format validation
  - Non-enumerating success message
  - Direct deep link test input / token navigation
- [x] **Reset-Password Screen (`src/app/(auth)/reset-password.tsx`)**
  - Token input (auto-populated via route params)
  - New password & confirm password validation
  - Argon2id password update on backend
  - Post-reset redirection to Sign In
- [x] **Verify-Email Screen (`src/app/(auth)/verify-email.tsx`)**
  - Auto-verification when token is provided via deep link
  - Manual token entry fallback
  - Resend verification email action with loading & haptic feedback
- [x] **Auth Gatekeeper & Protected Navigation (`src/app/index.tsx`)**
  - Checks onboarding completion status first
  - Checks auth session restoration status second
  - Seamless redirection to `(tabs)` if authenticated, or `(auth)/sign-in` if unauthenticated
- [x] **Profile Screen Integration (`src/app/(tabs)/profile.tsx`)**
  - User details (name, email, verification badge)
  - Edit Profile modal (`EditProfileModal.tsx`) for name, currency, locale, theme
  - Language selection modal (`LanguageSelectorModal.tsx`) for English, Gujarati, Hindi
  - Logout confirmation modal
  - Logout All Devices option
- [x] **Internationalization (i18n)**
  - `i18next` and `react-i18next` configured
  - Locale translation catalogs: English (`en.json`), Gujarati (`gu.json`), Hindi (`hi.json`)
  - Instant runtime language switching with persistent storage
- [x] **Dual Theme Support**
  - Light Premium Theme (Warm off-white background, Forest Green primary, Emerald accents)
  - Dark Theme (Deep Charcoal and Forest Green surfaces, high-contrast typography)
  - Seamless across all auth screens, modals, and tabs
- [x] **Secure Token Management (`src/services/api/authApi.ts`)**
  - Access token held strictly in-memory
  - Refresh token stored in `expo-secure-store`
  - Automatic silent refresh queue on HTTP 401 responses

---

## 2. Backend API Architecture (Node.js + Express + Prisma + MySQL)

- [x] **Prisma ORM & MySQL Schema (`api/prisma/schema.prisma`)**
  - `User` model with `email`, `name`, `currency`, `locale`, `theme`, `isEmailVerified`
  - `AuthIdentity` model supporting multi-provider auth (`EMAIL`, `GOOGLE`)
  - `RefreshSession` model with hashed tokens (`token_hash`), `device_info`, `expires_at`, `revoked_at`
  - `VerificationToken` model with hashed tokens, single-use tracking (`used_at`)
  - `PasswordResetToken` model with hashed tokens, single-use tracking (`used_at`)
  - Initial migration generated (`api/prisma/migrations/20261027000000_init/migration.sql`)
- [x] **Argon2id Password Hashing (`api/src/utils/crypto.ts`)**
  - OWASP recommended parameters (64MB memory cost, 3 iterations)
  - Constant-time dummy verification on user-not-found to eliminate timing side-channels
- [x] **JWT Access Tokens (`api/src/utils/jwt.ts`)**
  - HMAC SHA-256 (`HS256`) signed with strong secret
  - 15-minute expiration
- [x] **Rotated Refresh Tokens & Replay Attack Protection (`api/src/services/token.service.ts`)**
  - 64-char crypto random tokens stored as SHA-256 hashes in database
  - 30-day session lifetime
  - Automatic token rotation on refresh
  - Reused token detection immediately revokes all sessions in family
- [x] **Google Sign-In Backend Verification (`api/src/services/google.service.ts`)**
  - Uses `google-auth-library` to cryptographically verify Google ID tokens
  - Creates or links account with verified email status
- [x] **Rate Limiting & Security Middlewares (`api/src/middleware/`)**
  - Helmet protection for HTTP headers
  - Strict CORS policy
  - `express-rate-limit` (10 req/15min for auth, 100 req/15min for general API)
  - Zod validation for all DTOs
  - Global error handler returning standardized JSON errors
- [x] **Full Auth Endpoints**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/google`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/logout-all`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/resend-verification`
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me`
  - `GET /api/v1/health`

---

## 3. Automated Test Results

- [x] **Backend Unit & Integration Tests (Vitest)**
  - `api/tests/unit/crypto.test.ts`: **4/4 passed**
  - `api/tests/unit/jwt.test.ts`: **2/2 passed**
  - `api/tests/unit/google.test.ts`: **2/2 passed**
  - `api/tests/integration/auth.test.ts`: **18/18 passed**
  - Total: **26/26 passed (100%)**
- [x] **Static Typecheck**
  - Mobile (`npx tsc --noEmit`): **0 errors**
  - Backend (`npm run build --prefix api`): **0 errors**
- [x] **ESLint**
  - `npx eslint .`: **0 errors, 0 warnings**
- [x] **Expo Doctor**
  - `npx expo-doctor`: **20/20 checks passed**
- [x] **Metro Bundler Export**
  - `npx expo export --platform android`: **Bundled successfully (3,309 modules)**
