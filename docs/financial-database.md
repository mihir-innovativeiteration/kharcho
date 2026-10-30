# Kharcho Financial Database & Schema Design

Kharcho Phase 3 introduces a normalized, production-grade financial database architecture designed for MySQL and Prisma ORM.

---

## 1. Relational Schema Architecture

```
┌────────────────────────────────────────────────────────┐
│                        User                            │
│  - id: UUID (PK)                                       │
│  - name, email, preferredLanguage, preferredTheme      │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      1:N      │                 1:N      │                 1:N
┌──────────────▼──────────┐    ┌──────────▼──────────┐    ┌──────────▼──────────┐
│        Category         │    │    PaymentMethod    │    │     Transaction     │
│  - id: UUID or stable PK│    │  - id: UUID/stable  │    │  - id: UUID (PK)    │
│  - userId: UUID? (Null) │    │  - userId: UUID?    │    │  - userId: UUID     │
│  - name: VARCHAR(100)   │    │  - name: VARCHAR    │    │  - type: INCOME/EXP │
│  - type: INCOME/EXPENSE │    │  - type: CASH/UPI/..│    │  - amount: DEC(19,4)│
│  - icon, color, isSystem│    │  - details, isSystem│    │  - categoryId (FK)  │
└──────────────┬──────────┘    └──────────┬──────────┘    │  - paymentMethod(FK)│
               │                          │               │  - transactionDate  │
               │ 1:N (Restrict)           │ 1:N (SetNull) │  - description      │
               └──────────────┬───────────┴───────────────┤  - notes: TEXT      │
                              │                           └─────────────────────┘
                              ▼
                   Protected Financial History
```

---

## 2. Models Specification

### 1. `Transaction`
- **Primary Key**: `id` UUID string (`@id @default(uuid())`).
- **Owner**: `userId` foreign key to `User`, indexed for high-speed user queries.
- **Transaction Type**: `type` enum (`INCOME` | `EXPENSE`).
- **Monetary Amount**: `amount` exact decimal `Decimal(19, 4)`:
  - 19 total digits, 4 fractional decimal places.
  - Guarantees exact representation of paisa/cents without IEEE-754 binary floating-point rounding errors.
- **Currency**: `currency` default `"INR"` (ISO-4217 standard).
- **Description**: Short merchant/transaction note (up to 255 characters).
- **Category Reference**: `categoryId` foreign key to `Category` (`onDelete: Restrict`).
  - Historical transactions cannot be orphaned by accidental category deletion.
- **Payment Method Reference**: `paymentMethodId` foreign key to `PaymentMethod` (`onDelete: SetNull`).
  - If a user deletes an old payment card/method, historical transactions remain intact with `paymentMethodId: null`.
- **Transaction Date**: `transactionDate` indexed for date-range and timeline trend aggregations.
- **Indexes**:
  - `@@index([userId])`
  - `@@index([userId, transactionDate])`
  - `@@index([userId, type])`
  - `@@index([categoryId])`
  - `@@index([paymentMethodId])`

### 2. `Category`
- Built-in system categories (`isSystem: true`, `userId: null`) have stable identifiers (`cat_food_dining`, `cat_groceries`, `cat_salary`, etc.).
- User custom categories (`isSystem: false`, `userId: <ownerId>`).
- Deletion rule: System categories cannot be deleted or modified; custom categories can only be deleted if no transactions reference them.
- Indexes: `@@index([userId])`, `@@index([type])`, `@@index([isSystem])`.

### 3. `PaymentMethod`
- Built-in system payment methods (`pm_cash`, `pm_upi`, `pm_debit_card`, `pm_credit_card`, `pm_bank_transfer`).
- User custom payment methods (`isSystem: false`, `userId: <ownerId>`).
- Indexes: `@@index([userId])`, `@@index([isSystem])`.

---

## 3. Monetary Integrity & Decimal Precision Policy

1. **Database Level**: `DECIMAL(19, 4)` prevents floating-point distortion.
2. **Application Level**:
   - Amounts are validated using regex (`^\d+(\.\d{1,4})?$`) and parsed via `Prisma.Decimal`.
   - Rejects zero (`0.00`), negative numbers (`-50`), scientific notation (`1e5`), non-finite values, and values exceeding 100 Billion INR.
   - Exact calculations use `addDecimals`, `subtractDecimals` from `@/utils/money.ts`.
3. **Serialization**: Amounts are serialized to API JSON responses as exact 2-decimal strings (e.g. `"250.00"`).

---

## 4. Idempotent Database Seeding

Run database seeding via:
```bash
npm run db:seed --prefix api
```
Uses `upsert({ where: { id }, update, create })` to ensure subsequent runs do not create duplicates or disrupt existing records.
