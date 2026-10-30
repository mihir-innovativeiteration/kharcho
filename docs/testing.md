# Kharcho Automated Testing & Quality Assurance

This document details the test suites, verification procedures, and automated quality gates implemented for Kharcho.

---

## 1. Quality Gates & Test Commands

### Backend Automated Test Matrix
Run all tests from repository root:
```bash
npm test --prefix api
```
Or with watch mode:
```bash
npm run test:watch --prefix api
```

### Mobile Verification Checks
Run strict TypeScript compilation:
```bash
npx tsc --noEmit
```
Run ESLint:
```bash
npx expo lint
```
Run Expo Doctor diagnostics:
```bash
npx expo-doctor
```

---

## 2. Test Suites Summary

Kharcho features **160 automated tests across 21 test files**, all passing with a 100% pass rate.

| Category | Test File | Tests | Focus / Scenarios |
| :--- | :--- | :--- | :--- |
| **End-to-End User Journey** | `tests/integration/e2e_journey.test.ts` | 1 | Complete 12-stage production lifecycle: register, expense, dashboard, income, budget, recurring, AI parse, AI confirm, offline sync, idempotent retry, IDOR protection, logout |
| **Security & Multi-Tenant Isolation** | `tests/integration/security_isolation.test.ts` | 16 | Cross-tenant authorization (User A vs User B) across transactions, budgets, goals, recurring rules, reminders, and sync mutations; unauthenticated 401s; `X-Request-Id` correlation |
| **Financial Integrity & Decimals** | `tests/unit/financial_integrity.test.ts` | 13 | Floating-point prevention (`0.1 + 0.2 === 0.30`), 10,000 sub-paise accumulation, ceiling & bounds, zero & negative rejection, leap-year calculations |
| **Authentication & Sessions** | `tests/integration/auth.test.ts` | 18 | Argon2id verification, JWT issuance, refresh token rotation, replay attack detection, password reset lifecycle |
| **Transactions API** | `tests/integration/transactions.test.ts` | 10 | Income & expense CRUD, pagination, filtering, idempotent mutations |
| **Financial Analytics** | `tests/integration/finance.test.ts` | 7 | Net cash flow, category breakdowns, daily timeline aggregation, multi-tenant isolation |
| **Budgets & Thresholds** | `tests/integration/budgets.test.ts` | 8 | Overall & category limits, utilization calculations, remaining amounts |
| **Budget Alerts** | `tests/integration/budget_alerts.test.ts` | 5 | Threshold triggers (50%, 80%, 100%), deduplication per period |
| **Savings Goals** | `tests/integration/savings_goals.test.ts` | 4 | Goal creation, milestone contributions, target progress |
| **Recurring & Occurrences** | `tests/integration/recurring.test.ts` | 8 | Rule schedules, automatic initial occurrence, payment confirmations, ledger posts |
| **Notifications & Reminders** | `tests/integration/notifications.test.ts` | 4 | In-app reminders, device push token registration, unread counts |
| **AI Transactions** | `tests/integration/ai_transactions.test.ts` | 13 | Read-only parse endpoints, multilingual candidate drafts, zero DB writes during parsing |
| **Offline Sync Outbox** | `tests/integration/sync.test.ts` | 8 | Offline mutation processing, idempotent retries, optimistic concurrency conflict handling |
| **Categories & Payment Methods** | `tests/integration/categories_paymentMethods.test.ts` | 7 | System vs user categories, type separation |
| **Crypto Utilities** | `tests/unit/crypto.test.ts` | 4 | Argon2id hashing, SHA-256 tokens, email normalization |
| **JWT Utilities** | `tests/unit/jwt.test.ts` | 2 | Access token sign and verify, expiration checks |
| **Google Sign-In** | `tests/unit/google.test.ts` | 2 | OAuth token signature and audience validation |
| **Rule-Based AI Parser** | `tests/unit/ruleBasedParser.test.ts` | 10 | Regex-based candidate extraction, Hinglish/Gujarati keywords |
| **Money Utilities** | `tests/unit/money.test.ts` | 7 | Decimal parsing, ceiling checks, Indian currency formatting |
| **Recurrence Engine** | `tests/unit/recurrence.test.ts` | 7 | Date math, anchor day retention, month rollover policies |
| **Analytics Engine** | `tests/unit/finance_analytics.test.ts` | 6 | Mathematical summaries, percentage calculations |

**Total: 21 test files, 160 tests passed, 0 failed.**
