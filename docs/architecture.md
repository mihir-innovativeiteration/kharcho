# Kharcho Architecture & Backend Architecture

## 1. System Overview

Kharcho is structured around strict separation of concerns, decoupling UI presentation from state management and data storage.

```
┌────────────────────────────────────────────────────────┐
│                   Expo Router Navigation               │
│  (Auth Stack: Sign In, Sign Up, Forgot, Reset, Verify) │
│  (Tabs: Home, Activity, Budgets, Insights, Profile)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 React Context Layer                     │
│  (ThemeContext, AuthContext, AppContext, useHaptics)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│            Typed Service Abstraction Layer             │
│    (IAuthService, ITransactionService, IBudgetService) │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼──────────────┐   ┌─────────▼─────────────┐
│   Local Offline Store      │   │  Node.js REST API     │
│  - LocalMockService        │   │  - Express.js (api/)  │
│  - Expo SecureStore (tokens│   │  - Prisma ORM         │
│  - AsyncStorage (prefs)    │   │  - MySQL Database     │
└────────────────────────────┘   │  - Argon2id & JWTs    │
                                 └───────────────────────┘
```

---

## 2. Authentication System (Phase 2 Realized)

Kharcho Phase 2 features a production-ready dual-token authentication infrastructure:
- **Client runtime**:
  - `authApi.ts`: In-memory access token management, silent refresh queue on HTTP 401, hardware keystore storage of refresh tokens via `expo-secure-store`.
  - `AuthContext.tsx`: Session restoration on app startup, profile caching, language and theme preferences synchronization.
- **Backend runtime (`api/`)**:
  - Express.js + Prisma ORM + MySQL.
  - Multi-provider authentication (`EMAIL`, `GOOGLE`).
  - Google ID token signature verification via `google-auth-library`.
  - Argon2id password hashing (OWASP standard, 64MB memory cost).
  - Rotated 30-day refresh sessions stored as SHA-256 hashes with reuse attack detection and immediate family session revocation.
  - Single-use, time-limited verification and password reset tokens.
  - Rate limiting (10 req/15min for auth, 100 req/15min for general API).
  - Helmet security headers and CORS protection.

---

## 3. Localization Architecture

Multilingual localization is implemented via `i18next` and `react-i18next`:
- Locales cataloged in `src/i18n/locales/`:
  - `en.json` (English)
  - `gu.json` (Gujarati)
  - `hi.json` (Hindi)
- Supported languages typed in `src/i18n/index.ts`:
  - Code: `en`, `gu`, `hi`
- Runtime language switching executes seamlessly across all screens and bottom tabs without app restart.
- User language preference is persisted locally and synchronized with `User.locale` in the backend.

---

## 4. Financial Computation & Data Integrity

Floating-point precision errors (e.g. `0.1 + 0.2 === 0.30000000000000004`) are avoided in Kharcho:
- Monetary inputs are sanitized to enforce at most 2 decimal places (`sanitizeCurrencyInput`).
- Conversion helpers (`rupeesToPaise` and `paiseToRupees`) support storing currency values as integer paise (cents equivalent).
- Savings rate formula is explicitly formalized:
  $$\text{Savings Rate (\%)} = \frac{\text{Total Inflow} - \text{Total Outflow}}{\text{Total Inflow}} \times 100$$

---

## 5. Storage & Key Management

- **Hardware Keystore (`expo-secure-store`)**:
  - iOS Keychain (`kSecAttrAccessibleAfterFirstUnlock`)
  - Android KeyStore (`EncryptedSharedPreferences`)
  - Stores high-entropy refresh tokens; zero plaintext tokens in AsyncStorage.
- **Local Cache (`@react-native-async-storage/async-storage`)**:
  - Used for non-sensitive local flags: theme preference (`@kharcho_theme_preference`), language preference (`@kharcho_language_preference_v2`), onboarding completion (`@kharcho_onboarding_completed_v1`).

---

## 6. Financial Analytics & Dashboard Architecture (Phase 4 Realized)

### 6.1 Data Aggregation & Server-side Computation
- **Net Activity Principle**: The central dashboard metric represents period net flow ($\text{Income} - \text{Expenses}$), explicitly distinguished from static account/bank balances.
- **Continuous Date Buckets**: `/api/v1/finance/trends` calculates full date ranges without temporal gaps, ensuring dual-series SVG charts render uniformly.
- **Adaptive Timeline Grouping**: Intervals $> 45$ days (e.g. 6-month view) automatically aggregate to monthly buckets (`groupBy: 'month'`), while short ranges render daily buckets (`groupBy: 'day'`).
- **Safe Comparison Metrics**: Prior-period calculations safeguard against zero denominators to prevent `NaN` or `Infinity`.

### 6.2 Mobile Presentation Layer
- **Concurrent Non-Blocking Fetching**: `useDashboardData` initiates parallel requests for summary, category breakdowns, trends, and recent transactions.
- **Sequence Protection**: Internal request sequence counters (`requestSeqRef`) discard outdated network responses when periods switch rapidly.
- **100% Native SVG Charts**: Rendered with `react-native-svg` with zero WebView or DOM dependencies, conforming to strict native mobile performance.
- **State Machine UI**: Standardized states for loading shimmer skeletons, network/offline errors with retry, zero-state onboarding CTA, and pull-to-refresh sync.

---

## 7. Smart Budgets, Savings Goals & Spending Alerts (Phase 5 Realized)

### 7.1 Budget Calculation Engine
- **Decoupled Scopes**: Supports both `OVERALL` monthly budgets and `CATEGORY` expense caps.
- **Strict Expense Attribution**: Only expense transactions (`type === 'EXPENSE'`) within the active calendar month count toward budget utilization. Income is rigorously excluded.
- **Preserved Negative Bounds**: Remaining amounts are calculated as $\text{Limit} - \text{Spent}$, allowing negative values to explicitly represent overspending without artificial clamping.
- **Threshold Progression**: Status transitions across `NORMAL` ($<50\%$), `WARNING_50` ($50\% - 79\%$), `WARNING_80` ($80\% - 99\%$), and `EXCEEDED` ($\ge 100\%$).

### 7.2 Idempotent Alert Deduplication
- **Unique Compound Keys**: Persistent alerts are stored in `BudgetAlert` with `@@unique([budgetId, thresholdPercent, periodKey])`. Repeated evaluations or rapid mutations will never produce duplicate alerts for the same threshold.
- **Asynchronous Triggering**: Transaction mutations evaluate active budget thresholds asynchronously, notifying users through the in-app notification center.

### 7.3 Savings Goals & Contribution Ledger
- **Server-Side Ledger Integrity**: Contributions are saved to `SavingsContribution`, creating an immutable ledger. Goal totals and progress are calculated on the server.
- **Two-Way Completion Recalculation**: Goals automatically complete upon reaching target amounts; reversing a contribution immediately restores status to `ACTIVE`.
- **Transparent Disclaimers**: Clear UX disclaimers confirm contributions are personal discipline tracking entries, not bank transfers.

---

## 8. Recurring Bills, EMIs & Smart Reminders (Phase 6 Realized)

### 8.1 Recurrence Engine & Calendar Anchoring
- **Frequencies**: `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY` with configurable intervals.
- **End-of-Month Clamping**: Anchors on day 29, 30, or 31 clamp to the destination month's maximum (e.g. Jan 31 -> Feb 28/29 -> Mar 31), maintaining original anchor day across leap and non-leap years.
- **Separation of Schedules & Ledger**: Projections and scheduled occurrences are stored separately in `RecurringOccurrence` and never affect account totals until marked `PAID`.
- **Idempotent Confirmations**: Confirming payment writes exactly 1 Transaction record, updates the occurrence with `@unique transactionId`, and computes the subsequent occurrence.

---

## 9. AI-Powered Natural Language Expense Entry (Phase 7 Realized)

### 9.1 Two-Step Parsing vs Ledger Pipeline
- **Parsing Phase (`POST /api/v1/ai/transactions/parse`)**:
  - Parses freeform multilingual text into candidate transaction drafts.
  - Rate-limited to 30 requests/min.
  - **Zero database writes**: Guarantees that conversational exploration or parsing attempts cannot create ghost transactions.
- **Confirmation Phase (`POST /api/v1/ai/transactions/confirm`)**:
  - Re-validates all candidate fields with Zod schemas.
  - Enforces ownership of `categoryId` and `paymentMethodId` against the authenticated user.
  - Executes creation through `TransactionService.createTransaction` with exact `Prisma.Decimal` arithmetic, triggering budget re-evaluations and alerts.
  - Idempotency keys prevent duplicate ledger entries on double-tap or network retry.

### 9.2 Multilingual Natural Language Parsing
- **Providers & Fallback**:
  - **Gemini 1.5 Flash Provider**: Generates structured JSON adhering to candidate draft schemas with strict 8s timeout abort controllers.
  - **Deterministic Rule-Based Parser**: High-precision local regex engine using Unicode property boundaries (`\p{L}\p{N}`) and stem wildcards (`પેટ્રોલ\S*`, `ખાવા\S*`).
  - Automatic, transparent fallback ensures continuous offline/unkeyed operability when `GEMINI_API_KEY` is absent.
- **Multi-Item & Indian Script Parsing**:
  - Multi-item splitting on English, Gujarati, and Hindi conjunctions (`and`, `ane`, `aur`, commas).
  - Devanagari (`०-९`) and Gujarati (`૦-૯`) native numeral translation.
  - Multipliers: `1.5k` ($1,500$), `2 lakh` ($2,00,000$).
  - Temporal anchors: `today` / `aaj` / `આજે`, `yesterday` / `ગઈકાલે`.
  - Clarification prompts for ambiguous relative dates (`kal` / `કાલ`).
- **Mobile Review UX**:
  - `SmartAddScreen` (`src/app/transaction/smart-add.tsx`) provides candidate review cards (`DraftCard.tsx`), editable amounts, category and payment chips, recurring alerts, and proposed totals before committing.

---

## 10. Offline-First Support, Reliable Sync & Smart Notifications (Phase 8 Realized)

### 10.1 Durable Local Database & Outbox Architecture
- **Expo SQLite Integration**:
  - `local_transactions`: Mirrors ledger entries with `sync_status` (`SYNCED`, `PENDING_CREATE`, `PENDING_UPDATE`, `PENDING_DELETE`, `CONFLICT`).
  - `sync_outbox`: Implements a persistent outbox pattern with transactional guarantees. Every offline create, update, or delete queues a mutation record before updating local UI state.
- **Client Mutation IDs & Stable Identification**:
  - Offline transactions generate deterministic `clientMutationId`s before sending.
  - After server synchronization, the client reconciles temporary local IDs with authoritative server IDs, preventing duplicate rows or ghost items.
- **Optimistic Concurrency & Conflict Detection**:
  - Transactions track an integer `version` field.
  - Updates verify `expectedVersion`; concurrent modifications generate structured conflict responses rather than blindly overwriting server data.

### 10.2 Sync Engine & Connectivity Lifecycle
- **Automated Lifecycle Transitions**:
  - `networkMonitor` tracks online/offline status with `expo-network`.
  - Offline-to-online transitions trigger immediate background synchronization.
  - Exponential backoff with random jitter prevents thundering herd load on reconnect.
- **Batch Processing (`POST /api/v1/sync/operations`)**:
  - Batches up to 50 pending mutations per request.
  - Server maintains `SyncReceipt` records ensuring idempotency across network retries.
  - Incremental change feed (`GET /api/v1/sync/changes`) advances client cursor without full database re-fetching.

### 10.3 Notifications Architecture
- **Local Scheduled Notifications**:
  - Scheduled using `expo-notifications` for recurring bill reminders with stable identifiers (`kharcho-bill-${occurrenceId}`).
  - Automatically cancelled when bills are paid or skipped to prevent spurious alerts.
- **Push Notification Infrastructure**:
  - Device tokens registered with `POST /api/v1/notifications/device-token`.
  - Automatic deactivation of stale tokens on `DeviceNotRegistered` receipts.
  - Server dispatcher honors granular user preferences for bills, budgets, milestones, and sync alerts.




