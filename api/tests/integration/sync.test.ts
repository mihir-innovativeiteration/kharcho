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

describe('Sync API & Offline Outbox Processing', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-sync-alice';
  const otherUserId = 'user-sync-bob';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Sync', email: 'alice.sync@example.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Sync', email: 'bob.sync@example.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice.sync@example.com', name: 'Alice Sync' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob.sync@example.com', name: 'Bob Sync' });
  });

  it('rejects unauthenticated sync requests', async () => {
    const res = await request(app).post('/api/v1/sync/operations').send({
      operations: [
        {
          operationId: 'op-1',
          entityType: 'TRANSACTION',
          entityId: 'temp-1',
          operationType: 'CREATE',
        },
      ],
    });
    expect(res.status).toBe(401);
  });

  it('successfully creates transaction from offline outbox mutation', async () => {
    const opId = 'op-create-1';
    const clientMutationId = 'mutation-c1';

    const res = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: opId,
            entityType: 'TRANSACTION',
            entityId: 'client-temp-tx-123',
            operationType: 'CREATE',
            clientMutationId,
            payload: {
              type: 'EXPENSE',
              amount: '350.00',
              currency: 'INR',
              description: 'Offline Groceryzepto',
              categoryId: 'cat_groceries',
              paymentMethodId: 'pm_upi',
              transactionDate: '2026-10-28T10:00:00.000Z',
              notes: 'Created without internet',
            },
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processed).toBe(1);

    const result = res.body.data.results[0];
    expect(result.operationId).toBe(opId);
    expect(result.status).toBe('APPLIED');
    expect(result.serverId).toBeDefined();
    expect(result.data.description).toBe('Offline Groceryzepto');
    expect(result.data.clientMutationId).toBe(clientMutationId);

    // Verify record in database
    const dbTx = await mockPrisma.transaction.findUnique({
      where: { id: result.serverId },
    });
    expect(dbTx).toBeDefined();
    expect(dbTx?.description).toBe('Offline Groceryzepto');
  });

  it('enforces idempotency on duplicate operationId retry', async () => {
    const opId = 'op-idempotent-test';
    const payload = {
      operations: [
        {
          operationId: opId,
          entityType: 'TRANSACTION',
          entityId: 'client-temp-tx-idem',
          operationType: 'CREATE',
          clientMutationId: 'mut-idem-1',
          payload: {
            type: 'EXPENSE',
            amount: '500.00',
            currency: 'INR',
            description: 'Idempotency Expense',
            categoryId: 'cat_food_dining',
            paymentMethodId: 'pm_cash',
            transactionDate: '2026-10-28T11:00:00.000Z',
          },
        },
      ],
    };

    // First attempt
    const firstRes = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(firstRes.status).toBe(200);
    const firstServerId = firstRes.body.data.results[0].serverId;

    // Count transactions in DB
    const countBefore = await mockPrisma.transaction.count({ where: { userId } });

    // Second retry with identical operationId
    const retryRes = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(retryRes.status).toBe(200);
    const retryServerId = retryRes.body.data.results[0].serverId;
    expect(retryServerId).toBe(firstServerId);

    // Total transactions must remain unchanged (no duplicate ledger entries!)
    const countAfter = await mockPrisma.transaction.count({ where: { userId } });
    expect(countAfter).toBe(countBefore);
  });

  it('processes UPDATE and increments version with optimistic concurrency', async () => {
    // 1. Create initial transaction
    const initial = await mockPrisma.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: '100.00',
        currency: 'INR',
        description: 'Original Name',
        categoryId: 'cat_groceries',
        transactionDate: new Date(),
        version: 1,
      },
    });

    // 2. Sync UPDATE with expectedVersion: 1
    const res = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: 'op-update-1',
            entityType: 'TRANSACTION',
            entityId: initial.id,
            operationType: 'UPDATE',
            expectedVersion: 1,
            payload: {
              description: 'Updated Name Offline',
              amount: '150.00',
            },
          },
        ],
      });

    expect(res.status).toBe(200);
    const result = res.body.data.results[0];
    expect(result.status).toBe('APPLIED');
    expect(result.data.description).toBe('Updated Name Offline');
    expect(result.data.version).toBe(2);
  });

  it('detects version conflict if record was modified remotely', async () => {
    // 1. Transaction at version 3
    const tx = await mockPrisma.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: '200.00',
        currency: 'INR',
        description: 'Server Modified',
        categoryId: 'cat_groceries',
        transactionDate: new Date(),
        version: 3,
      },
    });

    // 2. Client sends update expecting version 1
    const res = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: 'op-conflict-1',
            entityType: 'TRANSACTION',
            entityId: tx.id,
            operationType: 'UPDATE',
            expectedVersion: 1,
            payload: {
              description: 'Client Stale Update',
            },
          },
        ],
      });

    expect(res.status).toBe(200);
    const result = res.body.data.results[0];
    expect(result.status).toBe('CONFLICT');
    expect(result.error).toContain('Version mismatch');
    expect(result.serverRecord).toBeDefined();
  });

  it('soft-deletes transaction on DELETE mutation', async () => {
    const tx = await mockPrisma.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: '250.00',
        currency: 'INR',
        description: 'To Be Deleted',
        categoryId: 'cat_groceries',
        transactionDate: new Date(),
      },
    });

    const res = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: 'op-delete-1',
            entityType: 'TRANSACTION',
            entityId: tx.id,
            operationType: 'DELETE',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe('APPLIED');

    const updated = await mockPrisma.transaction.findUnique({
      where: { id: tx.id },
    });
    expect(updated?.deletedAt).not.toBeNull();
  });

  it('prevents IDOR: User A cannot update User B transaction', async () => {
    const bobsTx = await mockPrisma.transaction.create({
      data: {
        userId: otherUserId,
        type: 'EXPENSE',
        amount: '1000.00',
        currency: 'INR',
        description: 'Bobs Private Spend',
        categoryId: 'cat_groceries',
        transactionDate: new Date(),
      },
    });

    const res = await request(app)
      .post('/api/v1/sync/operations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        operations: [
          {
            operationId: 'op-hacker-1',
            entityType: 'TRANSACTION',
            entityId: bobsTx.id,
            operationType: 'UPDATE',
            payload: { description: 'Hacked description' },
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe('FAILED');
    expect(res.body.data.results[0].error).toContain('not found or inaccessible');
  });

  it('retrieves incremental changes via GET /api/v1/sync/changes', async () => {
    await mockPrisma.transaction.create({
      data: {
        userId,
        type: 'INCOME',
        amount: '50000.00',
        currency: 'INR',
        description: 'Monthly Salary',
        categoryId: 'cat_salary',
        transactionDate: new Date(),
      },
    });

    const res = await request(app)
      .get('/api/v1/sync/changes')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions.length).toBeGreaterThan(0);
    expect(res.body.data.serverTimestamp).toBeDefined();
  });
});
