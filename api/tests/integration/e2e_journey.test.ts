import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../setup/mockPrisma.js';

vi.mock('../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

const { createApp } = await import('../../src/app.js');
const app = createApp();
import { seedDefaults } from '../../src/services/seed.service.js';

describe('Kharcho End-to-End Full User Journey (12 Core Production Scenarios)', () => {
  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);
  });

  it('executes the full end-to-end journey seamlessly', async () => {
    // -------------------------------------------------------------
    // SCENARIO 1: Register and Authenticate a New User
    // -------------------------------------------------------------
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Mehta',
        email: 'aarav.mehta@kharcho.app',
        password: 'Password123!',
        preferredLanguage: 'en',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe('aarav.mehta@kharcho.app');
    expect(regRes.body.data.tokens.accessToken).toBeDefined();
    expect(regRes.body.data.tokens.refreshToken).toBeDefined();

    const userToken = regRes.body.data.tokens.accessToken;
    const refreshToken = regRes.body.data.tokens.refreshToken;
    const userId = regRes.body.data.user.id;

    // Verify profile retrieval
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.name).toBe('Aarav Mehta');

    // -------------------------------------------------------------
    // SCENARIO 2: Create Expense Transaction and Verify in History
    // -------------------------------------------------------------
    const txExpenseRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '1200.00',
        currency: 'INR',
        description: 'Dinner at Bawarchi Restaurant',
        categoryId: 'cat_food_dining',
        paymentMethodId: 'pm_upi',
        transactionDate: '2026-10-28T20:00:00.000Z',
      });

    expect(txExpenseRes.status).toBe(201);
    const expenseTxId = txExpenseRes.body.data.id;
    expect(expenseTxId).toBeDefined();

    // Verify transaction list contains this expense
    const listRes1 = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listRes1.status).toBe(200);
    expect(listRes1.body.data).toHaveLength(1);
    expect(listRes1.body.data[0].id).toBe(expenseTxId);
    expect(listRes1.body.data[0].amount).toBe('1200.00');

    // -------------------------------------------------------------
    // SCENARIO 3: Verify Dashboard & Financial Summary Update
    // -------------------------------------------------------------
    const summaryRes1 = await request(app)
      .get('/api/v1/finance/summary?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(summaryRes1.status).toBe(200);
    expect(summaryRes1.body.data.totalExpenses).toBe('1200.00');
    expect(summaryRes1.body.data.totalIncome).toBe('0.00');
    expect(summaryRes1.body.data.netActivity).toBe('-1200.00');

    // -------------------------------------------------------------
    // SCENARIO 4: Create Income Transaction and Verify Net Flow
    // -------------------------------------------------------------
    const txIncomeRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '45000.00',
        currency: 'INR',
        description: 'Monthly Salary Credit',
        categoryId: 'cat_salary',
        paymentMethodId: 'pm_bank_transfer',
        transactionDate: '2026-10-28T09:00:00.000Z',
      });

    expect(txIncomeRes.status).toBe(201);

    const summaryRes2 = await request(app)
      .get('/api/v1/finance/summary?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(summaryRes2.status).toBe(200);
    expect(summaryRes2.body.data.totalIncome).toBe('45000.00');
    expect(summaryRes2.body.data.totalExpenses).toBe('1200.00');
    expect(summaryRes2.body.data.netActivity).toBe('43800.00');

    // -------------------------------------------------------------
    // SCENARIO 5: Create Budget & Verify Spent Progress
    // -------------------------------------------------------------
    const budgetRes = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Food & Groceries Budget',
        type: 'CATEGORY',
        categoryId: 'cat_food_dining',
        amount: '6000.00',
        period: 'MONTHLY',
      });

    expect(budgetRes.status).toBe(201);
    const budgetId = budgetRes.body.data.id;

    // Get budget progress
    const budgetDetailRes = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(budgetDetailRes.status).toBe(200);
    expect(budgetDetailRes.body.data.spent).toBe('1200.00');
    expect(budgetDetailRes.body.data.remaining).toBe('4800.00');
    expect(budgetDetailRes.body.data.utilizationPercentage).toBe(20);

    // -------------------------------------------------------------
    // SCENARIO 6: Create Recurring Payment Rule & Confirm Occurrence
    // -------------------------------------------------------------
    const ruleRes = await request(app)
      .post('/api/v1/recurring-rules')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Broadband Fiber Internet',
        providerName: 'JioFiber',
        type: 'EXPENSE',
        amount: '999.00',
        currency: 'INR',
        frequency: 'MONTHLY',
        interval: 1,
        startDate: '2026-11-01T00:00:00.000Z',
        categoryId: 'cat_bills_utilities',
        reminderEnabled: true,
        reminderDaysBefore: 2,
      });

    expect(ruleRes.status).toBe(201);
    const ruleId = ruleRes.body.data.id;
    expect(ruleId).toBeDefined();

    // Verify occurrences are scheduled
    const occRes = await request(app)
      .get(`/api/v1/recurring-occurrences?ruleId=${ruleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(occRes.status).toBe(200);
    expect(occRes.body.data.length).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // SCENARIO 7: AI Parse Natural Language Entry (No DB Writes!)
    // -------------------------------------------------------------
    const initialTxCount = (await mockPrisma.transaction.findMany({ where: { userId } })).length;

    const parseRes = await request(app)
      .post('/api/v1/ai/transactions/parse')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        text: 'Paid 350 rupees for lunch via upi',
      });

    expect(parseRes.status).toBe(200);
    expect(parseRes.body.success).toBe(true);
    expect(parseRes.body.data.length).toBeGreaterThan(0);

    const draft = parseRes.body.data[0];
    expect(draft.amount).toBe('350.00');
    expect(draft.type).toBe('EXPENSE');

    // Critical security check: parsing must NOT write any record into the database
    const currentTxCount = (await mockPrisma.transaction.findMany({ where: { userId } })).length;
    expect(currentTxCount).toBe(initialTxCount);

    // -------------------------------------------------------------
    // SCENARIO 8: Confirm AI Draft (Exactly 1 Transaction Created)
    // -------------------------------------------------------------
    const confirmRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: draft.type,
        amount: draft.amount,
        currency: 'INR',
        description: draft.description || 'Lunch via UPI',
        categoryId: draft.categoryId || 'cat_food_dining',
        paymentMethodId: draft.paymentMethodId || 'pm_upi',
        transactionDate: draft.transactionDate || new Date().toISOString(),
      });

    expect(confirmRes.status).toBe(201);

    const postConfirmTxCount = (await mockPrisma.transaction.findMany({ where: { userId } })).length;
    expect(postConfirmTxCount).toBe(initialTxCount + 1);

    // -------------------------------------------------------------
    // SCENARIO 9: Offline Sync Outbox Enqueue & Process
    // -------------------------------------------------------------
    const syncOpId = 'op-e2e-offline-create';
    const clientMutationId = 'mut-e2e-12345';

    const syncRes = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: syncOpId,
            entityType: 'TRANSACTION',
            entityId: 'temp-tx-999',
            operationType: 'CREATE',
            clientMutationId,
            payload: {
              type: 'EXPENSE',
              amount: '250.00',
              currency: 'INR',
              description: 'Offline Tea & Snacks',
              categoryId: 'cat_food_dining',
              paymentMethodId: 'pm_cash',
              transactionDate: '2026-10-28T16:00:00.000Z',
            },
          },
        ],
      });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.data.processed).toBe(1);
    expect(syncRes.body.data.results[0].status).toBe('APPLIED');
    const syncedServerTxId = syncRes.body.data.results[0].serverId;
    expect(syncedServerTxId).toBeDefined();

    // -------------------------------------------------------------
    // SCENARIO 10: Retry Duplicate Sync Mutation (Idempotent)
    // -------------------------------------------------------------
    const retrySyncRes = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: syncOpId, // Exact same operationId
            entityType: 'TRANSACTION',
            entityId: 'temp-tx-999',
            operationType: 'CREATE',
            clientMutationId,
            payload: {
              type: 'EXPENSE',
              amount: '250.00',
              currency: 'INR',
              description: 'Offline Tea & Snacks',
              categoryId: 'cat_food_dining',
              paymentMethodId: 'pm_cash',
              transactionDate: '2026-10-28T16:00:00.000Z',
            },
          },
        ],
      });

    expect(retrySyncRes.status).toBe(200);
    // Must return original serverId without duplicating
    expect(retrySyncRes.body.data.results[0].serverId).toBe(syncedServerTxId);

    const totalSyncedTx = await mockPrisma.transaction.findMany({
      where: { clientMutationId },
    });
    expect(totalSyncedTx).toHaveLength(1); // No duplicates!

    // -------------------------------------------------------------
    // SCENARIO 11: Cross-User Tampering Attempt (User B vs User A)
    // -------------------------------------------------------------
    const regBob = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bob Malicious',
        email: 'bob.attacker@kharcho.app',
        password: 'Password123!',
      });

    expect(regBob.status).toBe(201);
    const bobToken = regBob.body.data.tokens.accessToken;

    // Bob attempts to read Aarav's expense
    const idorGet = await request(app)
      .get(`/api/v1/transactions/${expenseTxId}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect([403, 404]).toContain(idorGet.status);

    // Bob attempts to update Aarav's expense
    const idorUpdate = await request(app)
      .patch(`/api/v1/transactions/${expenseTxId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        amount: '0.01',
        description: 'Compromised',
      });

    expect([403, 404]).toContain(idorUpdate.status);

    // -------------------------------------------------------------
    // SCENARIO 12: Logout / Token Revocation
    // -------------------------------------------------------------
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Attempting to refresh with the revoked refresh token must be rejected
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect([400, 401]).toContain(refreshRes.status);
    expect(refreshRes.body.success).toBe(false);
  });
});
