# KHARCHO — PHASE 6: RECURRING BILLS, EMIs, SUBSCRIPTIONS & SMART REMINDERS

## Implementation Verification & Audit

### 1. Architectural Integrity & Isolation
- [x] **Strict Separation of Schedules and Transactions**: Unpaid occurrences and future bill projections are never mixed with verified financial ledger records or actual account balances.
- [x] **Idempotent Payment Confirmation**:
  - `confirmPaid` endpoint (`POST /api/v1/recurring-occurrences/:id/confirm-paid`) verifies the occurrence's status and existing `transactionId`.
  - Creating a payment records exactly 1 Transaction in the financial ledger with `Prisma.Decimal` arithmetic, advances the rule's `nextDueAt`, creates the next occurrence, and marks the current occurrence as `PAID`.
  - Duplicate calls safely detect `occurrence.status === 'PAID'` and return existing occurrence and transaction with `alreadyPaid: true` without creating multiple ledger records.
  - Database-level `@unique` constraint on `transactionId` in `RecurringOccurrence` prevents duplicate payment links.
- [x] **Multi-tenant Data Isolation (IDOR Prevention)**:
  - All recurring rule, occurrence, and reminder endpoints enforce `userId` checks.
  - Cross-user access returns HTTP 404 (preventing rule ID enumeration).

### 2. Recurrence Calculation Engine (`src/services/recurrence.service.ts`)
- [x] **Frequency Support**: DAILY, WEEKLY, MONTHLY, YEARLY with configurable `interval` (e.g. every 3 months).
- [x] **End-of-Month Clamping & Restoration**:
  - Anchoring on day 31 clamps to month maximum (Jan 31 -> Feb 28/29 -> Mar 31 -> Apr 30 -> May 31).
  - Preserves original anchor day across leap years (Feb 29) and standard years.
- [x] **End-Date Handling**: Calculates completion status and marks rules `COMPLETED` once past `endDate`.
- [x] **Deterministic Occurrence Keys**: Generates reproducible keys (`{ruleId}-{YYYY-MM-DD}`) to prevent duplicate occurrences.

### 3. Background Scheduler & Reminders (`src/services/recurringScheduler.service.ts`)
- [x] **Concurrency-Safe Scheduler**: Tick handler processes active rules, provisions missing occurrences, evaluates reminder windows, and auto-posts opt-in rules.
- [x] **Configurable Lead Times**: Supports 0 (on due date), 1, 3, and 7-day notification lead windows.
- [x] **In-App Reminders**: Persistent reminder records with unread count, `markRead`, and `markAllRead`.

### 4. Mobile User Experience & UI System
- [x] **Home Screen Upcoming Bills Card (`UpcomingBillsCard.tsx`)**:
  - Displays bills due in next 7 days.
  - Shows overdue badges, due today badges, and due in X days badges.
  - Quick action: "Paid" triggers confirmation modal directly from Home.
  - Quick action: "Skip" advances schedule without creating a transaction.
- [x] **Dedicated Recurring Bills Screen (`src/app/recurring/index.tsx`)**:
  - Summary cards: Monthly Bills, Monthly Recurring Income, Projected Net.
  - Clear transparency disclaimer: Projections are estimates and don't deduct bank funds until confirmed.
  - Filter tabs: "Upcoming & Due" vs "All Schedules".
  - Pause, Resume, and Delete actions with tactile feedback.
- [x] **Modals**:
  - `CreateRecurringRuleModal.tsx`: Complete creation flow with frequency selector, reminder lead times, and auto-post toggle.
  - `ConfirmPaidModal.tsx`: Idempotent payment confirmation with payment method selector and notes.
- [x] **Design & Themes**: Fully supports Light Premium (default) and Dark Mode.
- [x] **Trilingual Localization**: English (`en`), Gujarati (`gu`), and Hindi (`hi`).

### 5. Automated Verification
- [x] Unit Tests: 7/7 tests passing in `tests/unit/recurrence.test.ts`.
- [x] Integration Tests: 8/8 tests passing in `tests/integration/recurring.test.ts`.
- [x] Backend Suite: 95/95 tests passing across 14 test files.
- [x] Backend Build: TypeScript compiler `tsc` passed with 0 errors.
- [x] Mobile Typecheck: `npx tsc --noEmit` passed with 0 errors.
