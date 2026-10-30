# Kharcho (खर्चो) — Mobile Personal Finance App

> **"Understand your money, live in peace."**  
> A premium, minimalist personal finance and expense-tracking application built with React Native, Expo Router, and a dedicated Node.js + Express + Prisma + MySQL backend. Crafted specifically for the Indian financial ecosystem with trilingual localization (English, Gujarati, Hindi).

---

## 🌟 Product Overview

**Kharcho** helps students, working professionals, families, and freelancers build financial discipline and awareness. Designed with an Indian-first perspective, Kharcho natively supports:
- **Financial Database & Relational Accounting**: Income and expense tracking with Decimal(19,4) precision, custom and system categories, payment methods, and historical data preservation.
- **Complete Authentication System**: Secure email/password and Google Sign-In with backend ID token verification, session restoration, single-use password resets, and email verification.
- **Trilingual Support (i18n)**: English (`en`), Gujarati (`gu`), and Hindi (`hi`) with instant runtime switching and persistent preference.
- **Enterprise-Grade Security**: Argon2id password hashing, in-memory short-lived access tokens (15m), hardware-secured refresh tokens in `Expo SecureStore`, token rotation with replay detection, and rate limiting.
- **Financial Summaries & Analytics**: Server-side aggregation for net activity, category breakdown percentages, and daily timeline trends.
- **INR (₹) Currency Conventions**: Full Indian numbering grouping (Lakhs and Crores e.g. `₹1,45,000`).
- **Real-world Spending Categories**: Instant groceries (Blinkit/Zepto), Food & Dining, Rent & Housing, SIP & Wealth Creation, Commute & Cabs, Bills & Utilities.
- **Smart Budgets & Savings Goals**: Category-specific and overall monthly spending limits with threshold alerts, milestone savings tracking with manual contribution logging, and notification preferences.
- **Recurring Bills, EMIs & Smart Reminders**: Daily, weekly, monthly, and yearly recurring schedules with end-of-month and leap-year clamping, idempotent payment confirmations into the financial ledger, background scheduler tick, in-app smart reminders, and upcoming bills home widget.
- **AI-Powered Natural Language Expense Entry**: Multilingual natural language parser supporting English, Gujarati, Hindi, and Hinglish with multi-item splitting, Devanagari & Gujarati numeral parsing, Indian currency multipliers (`k`, `lakh`), temporal resolution (`today`, `yesterday`, ambiguous `kal`), rate-limiting, and an interactive draft review screen with idempotent confirmations.
- **Offline-First Support, Reliable Sync & Smart Notifications**: Robust local SQLite database with outbox mutation queue, automatic connectivity detection with exponential backoff and jitter, idempotent batch synchronization, optimistic concurrency conflict detection, and smart local scheduled bill and budget notifications with Expo push token registration.
- **Ergonomic Design**: 48pt accessible touch targets, high-contrast dark mode, tactile haptic feedback, safe area insets, and zero distracting fluff.

---

## 📱 Tech Stack

### Mobile Client
- **Framework**: [React Native 0.88](https://reactnative.dev/) & [Expo SDK 58](https://docs.expo.dev/)
- **Routing**: [Expo Router v58](https://docs.expo.dev/router/introduction/) (File-based routing under `src/app/`)
- **Language**: TypeScript with strict mode (`strict: true`)
- **Localization**: `i18next` & `react-i18next` (English, Gujarati, Hindi)
- **Iconography**: [Lucide React Native](https://lucide.dev/) (`lucide-react-native`)
- **Graphics & Charts**: [React Native SVG](https://github.com/software-mansion/react-native-svg) (100% native mobile charts)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- **Secure Storage**: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) (iOS Keychain / Android KeyStore)
- **Tooling**: ESLint flat config (`eslint-config-expo`), Prettier, Expo Doctor

### Backend API (`api/`)
- **Runtime**: Node.js + Express.js + TypeScript
- **Database**: MySQL 8.0+
- **ORM**: Prisma ORM with automated migrations
- **Monetary Precision**: `Decimal(19, 4)` and exact `Prisma.Decimal` arithmetic
- **Password Hashing**: Argon2id (`argon2` with OWASP-recommended parameters)
- **OAuth Verification**: `google-auth-library` (cryptographic ID token signature check)
- **Token Infrastructure**: HMAC SHA-256 JWT access tokens + SHA-256 hashed rotated refresh tokens
- **Security**: Helmet, strict CORS, `express-rate-limit`, Request correlation IDs (`X-Request-Id`), sanitized error masks, Zod schema validation
- **Testing**: Vitest + Supertest (160 automated unit, integration, security isolation, and E2E journey tests across 21 test suites)

---

## 🗂 Project Architecture

```
kharcho/
├── src/                          # Mobile Application (React Native + Expo)
│   ├── app/                      # Expo Router navigation routes
│   │   ├── _layout.tsx           # Global Root layout (Theme, AuthProvider, i18n, Safe Area)
│   │   ├── index.tsx             # Entry gatekeeper (Routes: Splash -> Onboarding -> Auth -> Tabs)
│   │   ├── onboarding.tsx        # Screen A: 3-page interactive onboarding carousel
│   │   ├── (auth)/               # Mobile Authentication Stack
│   │   │   ├── _layout.tsx       # Auth stack navigator
│   │   │   ├── sign-in.tsx       # Sign In with Email/Password & Google Sign-In
│   │   │   ├── sign-up.tsx       # Registration with password strength & confirmation
│   │   │   ├── forgot-password.tsx# Non-enumerating password reset request
│   │   │   ├── reset-password.tsx# Token-based password reset
│   │   │   └── verify-email.tsx  # Email verification flow & resend
│   │   ├── (tabs)/               # Bottom tab navigator
│   │   │   ├── _layout.tsx       # Bottom bar with custom Lucide icons & active states
│   │   │   ├── index.tsx         # Screen B: Home Dashboard with live metrics
│   │   │   ├── activity.tsx      # Screen C: Live Transaction History, search & filters
│   │   │   ├── budgets.tsx       # Screen D: Budgets & Spending Caps
│   │   │   ├── insights.tsx      # Screen E: Monthly Analytics & Trends
│   │   │   └── profile.tsx       # Screen F: Profile, Language & Theme Settings
│   │   └── transaction/
│   │       ├── [id].tsx          # Transaction Detail Receipt screen & deletion
│   │       ├── new.tsx           # Modal for logging new Expense / Income to backend
│   │       └── smart-add.tsx     # AI Natural Language Expense Entry modal
│   ├── components/               # Atomic UI components & feature modules
│   │   ├── ui/                   # Reusable UI (Button, Input, GoogleButton, Modals)
│   │   ├── ai/                   # DraftCard review component for AI candidates
│   │   ├── dashboard/            # Dashboard cards & charts
│   │   ├── transactions/         # Transaction rows
│   │   ├── budgets/              # Budget progress cards
│   │   ├── insights/             # Spending analytics & charts
│   │   └── profile/              # EditProfileModal, LanguageSelectorModal
│   ├── constants/                # Theme tokens & configs
│   ├── context/                  # AuthContext, ThemeContext, AppContext
│   ├── hooks/                    # useTheme, useAuth, useApp, useHaptics
│   ├── i18n/                     # i18next configuration & locales (en, gu, hi)
│   ├── services/                 # Live transactionApi, financeApi, authApi, mock
│   ├── types/                    # Domain models & API types
│   └── utils/                    # Indian currency, dates, Google auth, crypto
├── api/                          # Backend API (Node.js + Express + Prisma)
│   ├── prisma/                   # Prisma schema & migrations
│   │   ├── schema.prisma         # Transaction, Category, PaymentMethod models
│   │   └── migrations/           # Automated MySQL migrations
│   ├── src/
│   │   ├── config/               # DB client & environment configuration
│   │   ├── controllers/          # Transaction, Category, PaymentMethod, Finance controllers
│   │   ├── middleware/           # Auth, rate-limit, validation, errors
│   │   ├── routes/               # API v1 routes (/transactions, /finance, /categories, etc.)
│   │   ├── services/             # TransactionService, FinanceService, CategoryService, etc.
│   │   ├── utils/                # Monetary precision (Decimal), Crypto (Argon2id), JWT
│   │   ├── validators/           # Zod schemas for incoming payloads
│   │   ├── app.ts                # Express app setup
│   │   └── server.ts             # HTTP server entrypoint
│   └── tests/                    # Vitest unit & integration test suites (55 tests)
├── docs/                         # Comprehensive documentation
│   ├── financial-database.md     # Relational schema, Decimal(19,4), foreign keys
│   ├── transaction-apis.md       # Complete API reference, pagination, filters, reports
│   ├── authentication.md         # Architecture, token lifecycle, Google auth
│   ├── security.md               # Argon2id, token rotation, rate limiting, defense in depth
│   ├── local-development.md      # Setup guide for backend and mobile
│   ├── testing.md                # Automated test matrix & QA procedures
│   ├── design-system.md          # Visual design tokens & styling guidelines
│   ├── phase-1-checklist.md      # Phase 1 UI/UX checklist
│   ├── phase-2-checklist.md      # Phase 2 Authentication checklist
│   └── phase-3-checklist.md      # Phase 3 Financial APIs checklist
├── app.json
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or bun
- MySQL 8.0+

### 1. Setting up the Backend API

```bash
cd d:/kharcho/api
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client & apply database migration
npx prisma generate
npx prisma migrate dev --name init

# Seed default categories and payment methods idempotently
npm run db:seed

# Run automated tests (55 passing tests)
npm test

# Start the development server (runs on port 4000)
npm run dev
```

### 2. Setting up the Mobile App

```bash
cd d:/kharcho
npm install

# Run diagnostics and checks
npx eslint .          # 0 errors, 0 warnings
npx tsc --noEmit      # Strict TypeScript check
npx expo-doctor       # 20/20 checks passed

# Start the Expo development server
npx expo start
```
- Press `a` for Android emulator (`http://10.0.2.2:4000/api/v1`).
- Press `i` for iOS simulator (`http://localhost:4000/api/v1`).
- Press `w` for Web browser.
- Scan QR code using Expo Go on your physical phone.

---

## 🧪 Automated Testing

Kharcho includes automated test suites across both backend and frontend layers:

```bash
# Run backend tests (Vitest: 55 unit & integration tests)
npm test --prefix api

# Run mobile linter (ESLint)
npx eslint .

# Run mobile typecheck
npx tsc --noEmit
```

---

## 🎨 Theme System

Kharcho includes two handcrafted themes:
1. **Light Premium**: Warm off-white background (`#F8F9F8`), elevated card surfaces (`#FFFFFF`), deep forest green primary (`#0F382C`), and emerald accents (`#10B981`).
2. **Dark Premium**: Deep charcoal forest surfaces (`#0B1311` & `#12201C`), contrasted readable typography (`#F8FAFC`), and vibrant emerald highlights (`#34D399`).

Users can switch between **Light**, **Dark**, and **System** directly from **Profile & Settings > Appearance**. Changes update instantly across all screens.

---

## 🌐 Multilingual Support (English, Gujarati, Hindi)

Change language at any time in **Profile & Settings > Language**:
- **English**: Default language.
- **ગુજરાતી (Gujarati)**: Full translation across all navigation, transactions, forms, buttons, and alerts.
- **हिन्दी (Hindi)**: Full translation across all navigation, transactions, forms, buttons, and alerts.

---

## 📄 Documentation Links

- [Financial Database & Schema](docs/financial-database.md)
- [Transaction & Finance API Reference](docs/transaction-apis.md)
- [Authentication Architecture](docs/authentication.md)
- [Security & Protection Guide](docs/security.md)
- [Local Development Guide](docs/local-development.md)
- [Testing & Quality Assurance](docs/testing.md)
- [Phase 3 Verification Checklist](docs/phase-3-checklist.md)
- [Phase 4 Verification Checklist](docs/phase-4-checklist.md)
- [Phase 5 Verification Checklist](docs/phase-5-checklist.md)
- [Phase 6 Verification Checklist](docs/phase-6-checklist.md)
- [Phase 7 Verification Checklist](docs/phase-7-checklist.md)
- [Phase 8 Verification Checklist](docs/phase-8-checklist.md)
- [Security Threat Model & Production Audit](docs/security-threat-model.md)
- [Phase 9 Verification Checklist](docs/phase-9-checklist.md)
- [Phase 10 Complete QA & Release Readiness Report](docs/phase-10-qa-report.md)
- [Real-Device Smoke-Test Checklist](docs/smoke-test-checklist.md)

---

## 📄 License

MIT License. Designed and developed with precision for the Indian personal finance ecosystem.
