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

describe('Budget Management & Calculation API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-budget-1';
  const otherUserId = 'user-budget-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Budget', email: 'alice@budget.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Budget', email: 'bob@budget.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@budget.com', name: 'Alice Budget' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@budget.com', name: 'Bob Budget' });
  });

  it('creates an overall monthly budget and returns calculated progress', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'October Overall Spend',
        type: 'OVERALL',
        amount: '50000.00',
        period: 'MONTHLY',
        warningThresholds: [50, 80, 100],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('October Overall Spend');
    expect(res.body.data.type).toBe('OVERALL');
    expect(res.body.data.amount).toBe('50000.00');
    expect(res.body.data.spent).toBe('0.00');
    expect(res.body.data.remaining).toBe('50000.00');
    expect(res.body.data.utilizationPercentage).toBe(0);
    expect(res.body.data.isExceeded).toBe(false);
    expect(res.body.data.thresholdStatus).toBe('NORMAL');
  });

  it('creates a category-specific budget for an EXPENSE category', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Dining Out',
        type: 'CATEGORY',
        categoryId: 'cat_food_dining',
        amount: '12000.00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.categoryId).toBe('cat_food_dining');
    expect(res.body.data.amount).toBe('12000.00');
  });

  it('rejects category budgets assigned to an INCOME category', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Salary Budget',
        type: 'CATEGORY',
        categoryId: 'cat_salary', // Income category
        amount: '50000.00',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/EXPENSE/i);
  });

  it('rejects invalid or non-positive budget amounts', async () => {
    const resZero = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Zero Budget',
        type: 'OVERALL',
        amount: '0.00',
      });
    expect(resZero.status).toBe(400);

    const resNeg = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Negative Budget',
        type: 'OVERALL',
        amount: '-500.00',
      });
    expect(resNeg.status).toBe(400);
  });

  it('calculates spending from actual expenses and excludes income', async () => {
    // 1. Create category budget for Groceries: 10,000.00
    await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Groceries Limit',
        type: 'CATEGORY',
        categoryId: 'cat_groceries',
        amount: '10000.00',
      });

    // 2. Add an Income transaction: 75,000.00 (Must NOT count toward budget)
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '75000.00',
        description: 'Monthly Salary',
        categoryId: 'cat_salary',
        transactionDate: new Date().toISOString(),
      });

    // 3. Add an Expense for Groceries: 3,500.50
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '3500.50',
        description: 'Zepto groceries',
        categoryId: 'cat_groceries',
        transactionDate: new Date().toISOString(),
      });

    // 4. Add an Expense for another category (Food): 1,200.00
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '1200.00',
        description: 'Cafe coffee day',
        categoryId: 'cat_food_dining',
        transactionDate: new Date().toISOString(),
      });

    // 5. Query user budgets
    const res = await request(app)
      .get('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const groceryBudget = res.body.data.find((b: any) => b.categoryId === 'cat_groceries');
    expect(groceryBudget).toBeDefined();
    expect(groceryBudget.amount).toBe('10000.00');
    expect(groceryBudget.spent).toBe('3500.50'); // Only groceries expense
    expect(groceryBudget.remaining).toBe('6499.50');
    expect(groceryBudget.utilizationPercentage).toBe(35.0);
    expect(groceryBudget.thresholdStatus).toBe('NORMAL');
  });

  it('correctly reports exceeded budget when expenses surpass limit', async () => {
    // Budget: 5,000.00
    const budgetRes = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Shopping Cap',
        type: 'CATEGORY',
        categoryId: 'cat_shopping',
        amount: '5000.00',
      });
    const budgetId = budgetRes.body.data.id;

    // Expense: 7,500.00
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '7500.00',
        description: 'Electronics store',
        categoryId: 'cat_shopping',
        transactionDate: new Date().toISOString(),
      });

    const res = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.spent).toBe('7500.00');
    expect(res.body.data.remaining).toBe('-2500.00'); // Negative indicates exceeded
    expect(res.body.data.isExceeded).toBe(true);
    expect(res.body.data.utilizationPercentage).toBe(150.0);
    expect(res.body.data.thresholdStatus).toBe('EXCEEDED');
  });

  it('prevents cross-user IDOR access (read, update, delete)', async () => {
    const budgetRes = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Private Budget',
        type: 'OVERALL',
        amount: '40000.00',
      });
    const budgetId = budgetRes.body.data.id;

    // Bob tries to read Alice's budget
    const readRes = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(readRes.status).toBe(404);

    // Bob tries to edit Alice's budget
    const patchRes = await request(app)
      .patch(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ amount: '99999.00' });
    expect(patchRes.status).toBe(404);

    // Bob tries to delete Alice's budget
    const deleteRes = await request(app)
      .delete(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(deleteRes.status).toBe(404);
  });

  it('prevents creating duplicate active budgets for the same category and period', async () => {
    await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Groceries 1',
        type: 'CATEGORY',
        categoryId: 'cat_groceries',
        amount: '8000.00',
      });

    const duplicateRes = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Groceries 2',
        type: 'CATEGORY',
        categoryId: 'cat_groceries',
        amount: '12000.00',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });
});
