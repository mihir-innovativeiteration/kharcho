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

describe('Transactions API & Security', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-alice-123';
  const otherUserId = 'user-bob-456';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Test', email: 'alice@example.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Test', email: 'bob@example.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@example.com', name: 'Alice Test' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@example.com', name: 'Bob Test' });
  });

  it('creates a valid expense transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '450.50',
        currency: 'INR',
        description: 'Dinner at Punjabi Rasoi',
        categoryId: 'cat_food_dining',
        paymentMethodId: 'pm_upi',
        transactionDate: '2026-10-27T19:30:00.000Z',
        notes: 'With office team',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe('450.50');
    expect(res.body.data.type).toBe('EXPENSE');
    expect(res.body.data.category.name).toBe('Food & Dining');
    expect(res.body.data.paymentMethod.name).toBe('UPI');
    expect(res.body.data.userId).toBe(userId);
  });

  it('creates a valid income transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '85000.00',
        currency: 'INR',
        description: 'Monthly Salary',
        categoryId: 'cat_salary',
        paymentMethodId: 'pm_bank_transfer',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('INCOME');
    expect(res.body.data.amount).toBe('85000.00');
    expect(res.body.data.category.name).toBe('Salary');
  });

  it('rejects zero, negative, or malformed amounts', async () => {
    const badZero = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '0.00',
        description: 'Free coffee',
        categoryId: 'cat_food_dining',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });
    expect(badZero.status).toBe(400);

    const badNegative = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '-150.00',
        description: 'Negative refund',
        categoryId: 'cat_food_dining',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });
    expect(badNegative.status).toBe(400);

    const badString = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: 'hundred',
        description: 'Invalid text',
        categoryId: 'cat_food_dining',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });
    expect(badString.status).toBe(400);
  });

  it('rejects invalid transaction types and dates', async () => {
    const badType = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INVESTMENT_TRANSFER',
        amount: '500.00',
        description: 'Invalid type',
        categoryId: 'cat_food_dining',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });
    expect(badType.status).toBe(400);

    const badDate = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '500.00',
        description: 'Bad date',
        categoryId: 'cat_food_dining',
        transactionDate: 'yesterday-afternoon',
      });
    expect(badDate.status).toBe(400);
  });

  it('rejects an income transaction using an incompatible expense category', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '1200.00',
        description: 'Incompatible income',
        categoryId: 'cat_food_dining', // Food & Dining is an EXPENSE category!
        transactionDate: '2026-10-27T10:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('incompatible with transaction type');
  });

  it('rejects a category belonging to another user', async () => {
    // Bob creates private category
    const bobsCategory = await mockPrisma.category.create({
      data: {
        userId: otherUserId,
        name: "Bob's Secret Venture",
        type: 'EXPENSE',
        icon: 'Lock',
        isSystem: false,
      },
    });

    // Alice tries to log transaction using Bob's private category
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '500.00',
        description: 'Attempting IDOR',
        categoryId: bobsCategory.id,
        transactionDate: '2026-10-27T10:00:00.000Z',
      });

    expect(res.status).toBe(404);
  });

  it('rejects a payment method belonging to another user', async () => {
    // Bob creates private payment method
    const bobsPm = await mockPrisma.paymentMethod.create({
      data: {
        userId: otherUserId,
        name: "Bob's Private Card",
        type: 'CARD',
        isSystem: false,
      },
    });

    // Alice tries to log transaction using Bob's payment method
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '350.00',
        description: 'Alice spending with Bob PM',
        categoryId: 'cat_groceries',
        paymentMethodId: bobsPm.id,
        transactionDate: '2026-10-27T10:00:00.000Z',
      });

    expect(res.status).toBe(404);
  });

  it('lists transactions with pagination, filters, and search', async () => {
    // Seed 3 transactions for Alice
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '120.00',
        description: 'Metro card recharge',
        categoryId: 'cat_transportation',
        transactionDate: '2026-10-25T08:00:00.000Z',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '850.00',
        description: 'Weekly Vegetables Blinkit',
        categoryId: 'cat_groceries',
        transactionDate: '2026-10-26T11:00:00.000Z',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '15000.00',
        description: 'Freelance Design Project',
        categoryId: 'cat_freelance',
        transactionDate: '2026-10-27T14:00:00.000Z',
      });

    // 1. Pagination check
    const pageRes = await request(app)
      .get('/api/v1/transactions?limit=2&page=1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(pageRes.status).toBe(200);
    expect(pageRes.body.data.length).toBe(2);
    expect(pageRes.body.pagination.total).toBe(3);
    expect(pageRes.body.pagination.totalPages).toBe(2);

    // 2. Type filter check
    const expenseOnly = await request(app)
      .get('/api/v1/transactions?type=EXPENSE')
      .set('Authorization', `Bearer ${userToken}`);
    expect(expenseOnly.body.data.length).toBe(2);
    expect(expenseOnly.body.data.every((t: any) => t.type === 'EXPENSE')).toBe(true);

    // 3. Search query check
    const searchRes = await request(app)
      .get('/api/v1/transactions?search=Blinkit')
      .set('Authorization', `Bearer ${userToken}`);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].description).toBe('Weekly Vegetables Blinkit');
  });

  it('updates permitted fields of an owned transaction', async () => {
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '500.00',
        description: 'Book purchase',
        categoryId: 'cat_education',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });

    const txId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/v1/transactions/${txId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: '650.00',
        description: 'Technical Architecture Book',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.amount).toBe('650.00');
    expect(updateRes.body.data.description).toBe('Technical Architecture Book');
  });

  it('prevents unauthorized access, update, and deletion across users', async () => {
    // Alice creates a transaction
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '999.00',
        description: 'Alice Private Expense',
        categoryId: 'cat_shopping',
        transactionDate: '2026-10-27T10:00:00.000Z',
      });

    const txId = createRes.body.data.id;

    // Bob tries to view Alice transaction
    const viewRes = await request(app)
      .get(`/api/v1/transactions/${txId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(viewRes.status).toBe(404);

    // Bob tries to edit Alice transaction
    const editRes = await request(app)
      .patch(`/api/v1/transactions/${txId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ amount: '1.00' });
    expect(editRes.status).toBe(404);

    // Bob tries to delete Alice transaction
    const deleteRes = await request(app)
      .delete(`/api/v1/transactions/${txId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(deleteRes.status).toBe(404);

    // Alice deletes her own transaction successfully
    const aliceDeleteRes = await request(app)
      .delete(`/api/v1/transactions/${txId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(aliceDeleteRes.status).toBe(200);
    expect(aliceDeleteRes.body.success).toBe(true);
  });
});
