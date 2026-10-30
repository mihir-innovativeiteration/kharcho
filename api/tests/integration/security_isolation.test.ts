import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../setup/mockPrisma.js';

vi.mock('../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

const { createApp } = await import('../../src/app.js');
const app = createApp();
import { generateAccessToken } from '../../src/utils/jwt.js';
import { seedDefaults } from '../../src/services/seed.service.js';

describe('Security Audit & Strict Multi-Tenant Isolation', () => {
  const userA = {
    id: 'user-alice-sec-001',
    name: 'Alice Security',
    email: 'alice.sec@example.com',
  };

  const userB = {
    id: 'user-bob-sec-002',
    name: 'Bob Security',
    email: 'bob.sec@example.com',
  };

  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userA.id, name: userA.name, email: userA.email },
    });
    await mockPrisma.user.create({
      data: { id: userB.id, name: userB.name, email: userB.email },
    });

    tokenA = generateAccessToken({ sub: userA.id, email: userA.email, name: userA.name });
    tokenB = generateAccessToken({ sub: userB.id, email: userB.email, name: userB.name });
  });

  describe('Unauthenticated and Invalid Access Protection', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const endpoints = [
        { method: 'get', url: '/api/v1/transactions' },
        { method: 'post', url: '/api/v1/transactions' },
        { method: 'get', url: '/api/v1/budgets' },
        { method: 'get', url: '/api/v1/savings-goals' },
        { method: 'get', url: '/api/v1/recurring-rules' },
        { method: 'get', url: '/api/v1/reminders' },
        { method: 'post', url: '/api/v1/sync/operations' },
        { method: 'post', url: '/api/v1/ai/transactions/parse' },
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.url);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });

    it('rejects tampered or forged Bearer tokens with 401', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('attaches and preserves X-Request-Id header on all requests and responses', async () => {
      const customReqId = 'audit-req-xyz-987';
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-Request-Id', customReqId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customReqId);
    });

    it('generates an X-Request-Id if not provided by client', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
    });
  });

  describe('Transaction Cross-User Isolation (IDOR Prevention)', () => {
    let txAId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'EXPENSE',
          amount: '1250.00',
          currency: 'INR',
          description: "Alice's Secret Expense",
          categoryId: 'cat_food_dining',
          transactionDate: new Date().toISOString(),
        });

      expect(createRes.status).toBe(201);
      txAId = createRes.body.data.id;
    });

    it('prevents User B from fetching User A transaction by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/transactions/${txAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('prevents User B from modifying User A transaction', async () => {
      const res = await request(app)
        .patch(`/api/v1/transactions/${txAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          amount: '99999.00',
          description: 'Hacked by Bob',
        });

      expect([403, 404]).toContain(res.status);

      // Verify transaction in DB was NOT changed
      const originalTx = await mockPrisma.transaction.findUnique({ where: { id: txAId } });
      expect(originalTx?.description).toBe("Alice's Secret Expense");
      expect(Number(originalTx?.amount)).toBe(1250);
    });

    it('prevents User B from deleting User A transaction', async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/${txAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);

      const activeTx = await mockPrisma.transaction.findUnique({ where: { id: txAId } });
      expect(activeTx?.deletedAt).toBeNull();
    });

    it('ensures User B transaction list does not contain User A transactions', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('Budget Cross-User Isolation', () => {
    let budgetAId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: "Alice's Food Budget",
          type: 'CATEGORY',
          categoryId: 'cat_food_dining',
          amount: '8000.00',
          period: 'MONTHLY',
        });

      expect(createRes.status).toBe(201);
      budgetAId = createRes.body.data.id;
    });

    it('prevents User B from viewing User A budget details', async () => {
      const res = await request(app)
        .get(`/api/v1/budgets/${budgetAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);
    });

    it('prevents User B from updating User A budget', async () => {
      const res = await request(app)
        .patch(`/api/v1/budgets/${budgetAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          amount: '1.00',
        });

      expect([403, 404]).toContain(res.status);

      const dbBudget = await mockPrisma.budget.findUnique({ where: { id: budgetAId } });
      expect(Number(dbBudget?.amount)).toBe(8000);
    });

    it('prevents User B from deleting User A budget', async () => {
      const res = await request(app)
        .delete(`/api/v1/budgets/${budgetAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);

      const dbBudget = await mockPrisma.budget.findUnique({ where: { id: budgetAId } });
      expect(dbBudget).not.toBeNull();
    });
  });

  describe('Savings Goal Cross-User Isolation', () => {
    let goalAId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/savings-goals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: "Alice's Emergency Fund",
          targetAmount: '50000.00',
        });

      expect(createRes.status).toBe(201);
      goalAId = createRes.body.data.id;
    });

    it('prevents User B from viewing User A savings goal', async () => {
      const res = await request(app)
        .get(`/api/v1/savings-goals/${goalAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);
    });

    it('prevents User B from contributing to User A savings goal', async () => {
      const res = await request(app)
        .post(`/api/v1/savings-goals/${goalAId}/contribute`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          amount: '500.00',
        });

      expect([403, 404]).toContain(res.status);

      const contributions = await mockPrisma.savingsContribution.findMany({
        where: { goalId: goalAId },
      });
      expect(contributions).toHaveLength(0);
    });
  });

  describe('Recurring Rules & Reminders Cross-User Isolation', () => {
    let ruleAId: string;
    let reminderAId: string;

    beforeEach(async () => {
      const ruleRes = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: "Alice's Rent",
          amount: '18000.00',
          frequency: 'MONTHLY',
          interval: 1,
          startDate: '2026-11-01T00:00:00.000Z',
          categoryId: 'cat_rent',
        });

      expect(ruleRes.status).toBe(201);
      ruleAId = ruleRes.body.data.id;

      // Seed a reminder for User A
      const reminder = await mockPrisma.recurringReminder.create({
        data: {
          id: 'rem-alice-001',
          userId: userA.id,
          recurringRuleId: ruleAId,
          title: 'Rent Reminder',
          message: 'Rent is due soon',
          amount: 18000,
          currency: 'INR',
          dueDate: new Date(),
          channel: 'IN_APP',
          scheduledFor: new Date(),
        },
      });
      reminderAId = reminder.id;
    });

    it('prevents User B from modifying User A recurring rule', async () => {
      const res = await request(app)
        .patch(`/api/v1/recurring-rules/${ruleAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          amount: '1.00',
        });

      expect([403, 404]).toContain(res.status);

      const dbRule = await mockPrisma.recurringRule.findUnique({ where: { id: ruleAId } });
      expect(Number(dbRule?.amount)).toBe(18000);
    });

    it('prevents User B from reading or marking User A reminder as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/reminders/${reminderAId}/read`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);

      const dbReminder = await mockPrisma.recurringReminder.findUnique({ where: { id: reminderAId } });
      expect(dbReminder?.isRead).toBe(false);
    });
  });

  describe('Sync API Cross-User Tampering Prevention', () => {
    it('ignores or fails mutation attempts by User B targeting User A entities', async () => {
      // User A creates a transaction
      const tx = await mockPrisma.transaction.create({
        data: {
          id: 'tx-alice-sync-test',
          userId: userA.id,
          type: 'EXPENSE',
          amount: 500,
          description: 'Authentic Alice Tx',
          categoryId: 'cat_food_dining',
          transactionDate: new Date(),
          version: 1,
        },
      });

      // User B attempts to overwrite User A's transaction via sync
      const res = await request(app)
        .post('/api/v1/sync/operations')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          operations: [
            {
              operationId: 'malicious-mut-001',
              entityType: 'TRANSACTION',
              operationType: 'UPDATE',
              entityId: tx.id,
              payload: {
                description: 'Tampered by Bob',
                amount: 99999,
              },
            },
          ],
        });

      expect(res.status).toBe(200);

      // Verify User A's transaction was completely untouched
      const checkedTx = await mockPrisma.transaction.findUnique({ where: { id: tx.id } });
      expect(checkedTx?.description).toBe('Authentic Alice Tx');
      expect(Number(checkedTx?.amount)).toBe(500);
    });
  });
});
