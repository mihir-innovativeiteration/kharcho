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

describe('AI-Powered Natural Language Expense Entry API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-ai-1';
  const otherUserId = 'user-ai-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Aarav Sharma', email: 'aarav@kharcho.app' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Priya Patel', email: 'priya@kharcho.app' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'aarav@kharcho.app', name: 'Aarav Sharma' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'priya@kharcho.app', name: 'Priya Patel' });
  });

  describe('POST /api/v1/ai/transactions/parse', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .send({ text: '250 petrol UPI thi' });

      expect(res.status).toBe(401);
    });

    it('rejects empty or whitespace input', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('parses Hinglish multi-transaction sentence into 2 candidate drafts without writing to DB', async () => {
      const txCountBefore = mockPrisma.transactions.length;

      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'Aaje 250 nu petrol ane 120 ni coffee UPI thi',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);

      const [petrolDraft, coffeeDraft] = res.body.data;

      expect(petrolDraft.amount).toBe('250.00');
      expect(petrolDraft.type).toBe('EXPENSE');
      expect(petrolDraft.categoryId).toBe('cat_petrol_fuel');
      expect(petrolDraft.paymentMethodId).toBe('pm_upi');

      expect(coffeeDraft.amount).toBe('120.00');
      expect(coffeeDraft.type).toBe('EXPENSE');
      expect(coffeeDraft.categoryId).toBe('cat_food_dining');
      expect(coffeeDraft.paymentMethodId).toBe('pm_upi');

      // Parsing must NEVER create transactions!
      expect(mockPrisma.transactions.length).toBe(txCountBefore);
    });

    it('parses Gujarati native script with Gujarati numerals', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'આજે પેટ્રોલના ૫૦૦ રૂપિયા UPI થી ચૂકવ્યા',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      const draft = res.body.data[0];
      expect(draft.amount).toBe('500.00');
      expect(draft.categoryId).toBe('cat_petrol_fuel');
      expect(draft.paymentMethodId).toBe('pm_upi');
    });

    it('parses Hindi expense with symbol and UPI', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'आज ₹200 का खाना UPI से',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      const draft = res.body.data[0];
      expect(draft.amount).toBe('200.00');
      expect(draft.categoryId).toBe('cat_food_dining');
      expect(draft.paymentMethodId).toBe('pm_upi');
    });

    it('parses English income entry: "Salary received 45000 today in bank"', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'Salary received 45000 today in bank',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      const draft = res.body.data[0];
      expect(draft.type).toBe('INCOME');
      expect(draft.amount).toBe('45000.00');
      expect(draft.categoryId).toBe('cat_salary');
      expect(draft.paymentMethodId).toBe('pm_bank_transfer');
    });

    it('handles ambiguous date "kal 500 groceries" and asks for clarification', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'kal 500 groceries',
        });

      expect(res.status).toBe(200);
      const draft = res.body.data[0];
      expect(draft.needsClarification).toBe(true);
      expect(draft.clarificationQuestion).toContain('yesterday or tomorrow');
    });

    it('handles missing amount and asks user for clarification', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'Dinner with friends at cafe',
        });

      expect(res.status).toBe(200);
      const draft = res.body.data[0];
      expect(draft.amount).toBe('');
      expect(draft.needsClarification).toBe(true);
      expect(draft.clarificationQuestion).toContain('amount');
    });

    it('identifies recurring subscriptions and flags recommendation', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'Netflix 649 monthly subscription',
        });

      expect(res.status).toBe(200);
      const draft = res.body.data[0];
      expect(draft.amount).toBe('649.00');
      expect(draft.isRecurringSuggestion).toBe(true);
      expect(draft.recurringFrequency).toBe('MONTHLY');
    });
  });

  describe('POST /api/v1/ai/transactions/confirm', () => {
    it('confirms reviewed drafts and writes them to the financial ledger', async () => {
      const idempotencyKey = 'idem-key-batch-001';

      const res = await request(app)
        .post('/api/v1/ai/transactions/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          idempotencyKey,
          drafts: [
            {
              type: 'EXPENSE',
              amount: '250.00',
              currency: 'INR',
              description: 'Petrol',
              categoryId: 'cat_petrol_fuel',
              paymentMethodId: 'pm_upi',
              transactionDate: '2026-10-28T10:00:00.000Z',
              notes: 'Morning fuel refill',
            },
            {
              type: 'EXPENSE',
              amount: '120.00',
              currency: 'INR',
              description: 'Coffee',
              categoryId: 'cat_food_dining',
              paymentMethodId: 'pm_upi',
              transactionDate: '2026-10-28T10:15:00.000Z',
              notes: 'Cafe coffee',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.alreadyProcessed).toBe(false);

      // Verify transactions were saved in database
      const userTransactions = mockPrisma.transactions.filter((t) => t.userId === userId);
      expect(userTransactions.length).toBe(2);

      // IDEMPOTENCY TEST: Retrying with the same idempotencyKey returns existing transactions
      const retryRes = await request(app)
        .post('/api/v1/ai/transactions/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          idempotencyKey,
          drafts: [
            {
              type: 'EXPENSE',
              amount: '250.00',
              currency: 'INR',
              description: 'Petrol',
              categoryId: 'cat_petrol_fuel',
              paymentMethodId: 'pm_upi',
              transactionDate: '2026-10-28T10:00:00.000Z',
            },
          ],
        });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.success).toBe(true);
      expect(retryRes.body.alreadyProcessed).toBe(true);
      expect(retryRes.body.count).toBe(2);

      // Total transactions in DB did not increase!
      expect(mockPrisma.transactions.filter((t) => t.userId === userId).length).toBe(2);
    });

    it('rejects confirmation with nonexistent category ID', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          idempotencyKey: 'idem-key-invalid-cat-001',
          drafts: [
            {
              type: 'EXPENSE',
              amount: '300.00',
              currency: 'INR',
              description: 'Invalid category test',
              categoryId: 'cat_fake_nonexistent_123',
              transactionDate: '2026-10-28T10:00:00.000Z',
            },
          ],
        });

      expect(res.status).toBe(404);
    });

    it('rejects confirmation with negative or malformed amount', async () => {
      const res = await request(app)
        .post('/api/v1/ai/transactions/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          idempotencyKey: 'idem-key-bad-amount-001',
          drafts: [
            {
              type: 'EXPENSE',
              amount: '-500.00',
              currency: 'INR',
              description: 'Negative amount',
              categoryId: 'cat_food_dining',
              transactionDate: '2026-10-28T10:00:00.000Z',
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('enforces multi-tenant user isolation', async () => {
      const idempotencyKey = 'idem-key-isolation-001';

      // User A confirms a transaction
      await request(app)
        .post('/api/v1/ai/transactions/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          idempotencyKey,
          drafts: [
            {
              type: 'EXPENSE',
              amount: '1500.00',
              currency: 'INR',
              description: 'Private Dinner',
              categoryId: 'cat_food_dining',
              transactionDate: '2026-10-28T10:00:00.000Z',
            },
          ],
        });

      // User B checks their transaction history -> 0 transactions
      const userBTransactions = mockPrisma.transactions.filter((t) => t.userId === otherUserId);
      expect(userBTransactions.length).toBe(0);
    });
  });
});
