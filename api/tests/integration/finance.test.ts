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

describe('Financial Summaries & Reporting API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-finance-1';
  const otherUserId = 'user-finance-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Finance', email: 'alice@finance.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Finance', email: 'bob@finance.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@finance.com', name: 'Alice Finance' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@finance.com', name: 'Bob Finance' });
  });

  it('returns zero totals for empty periods', async () => {
    const res = await request(app)
      .get('/api/v1/finance/summary?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncome).toBe('0.00');
    expect(res.body.data.totalExpenses).toBe('0.00');
    expect(res.body.data.netActivity).toBe('0.00');
    expect(res.body.data.transactionCount).toBe(0);
    expect(res.body.data.currency).toBe('INR');
  });

  it('calculates income, expenses, and net activity with exact decimal precision', async () => {
    // Income: 75,000.50 + 24,999.50 = 100,000.00
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '75000.50',
        description: 'Primary Salary',
        categoryId: 'cat_salary',
        transactionDate: '2026-10-15T10:00:00.000Z',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INCOME',
        amount: '24999.50',
        description: 'Consulting Gig',
        categoryId: 'cat_freelance',
        transactionDate: '2026-10-20T10:00:00.000Z',
      });

    // Expenses: 22,000.25 + 3,500.75 = 25,501.00
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '22000.25',
        description: 'Apartment Rent',
        categoryId: 'cat_rent',
        transactionDate: '2026-10-02T10:00:00.000Z',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '3500.75',
        description: 'Monthly Groceries',
        categoryId: 'cat_groceries',
        transactionDate: '2026-10-10T10:00:00.000Z',
      });

    // Expected:
    // Total Income = 100000.00
    // Total Expenses = 25501.00
    // Net Activity = 100000.00 - 25501.00 = 74499.00
    const summaryRes = await request(app)
      .get('/api/v1/finance/summary?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalIncome).toBe('100000.00');
    expect(summaryRes.body.data.totalExpenses).toBe('25501.00');
    expect(summaryRes.body.data.netActivity).toBe('74499.00');
    expect(summaryRes.body.data.transactionCount).toBe(4);
  });

  it('prevents cross-user data leaking in summaries', async () => {
    // Bob logs a huge transaction: 5,000,000.00
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        type: 'INCOME',
        amount: '5000000.00',
        description: 'Bob Angel Investment',
        categoryId: 'cat_investment_income',
        transactionDate: '2026-10-15T10:00:00.000Z',
      });

    // Alice queries summary for October 2026
    const aliceSummary = await request(app)
      .get('/api/v1/finance/summary?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    // Alice must see 0 income, completely isolated from Bob's record
    expect(aliceSummary.body.data.totalIncome).toBe('0.00');
  });

  it('returns category breakdown with percentages and totals', async () => {
    // Seed 2 expenses for Alice
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '7500.00',
        description: 'Groceries Mart',
        categoryId: 'cat_groceries',
        transactionDate: '2026-10-05T10:00:00.000Z',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '2500.00',
        description: 'Fuel Station',
        categoryId: 'cat_petrol_fuel',
        transactionDate: '2026-10-12T10:00:00.000Z',
      });

    // Total = 10,000.00 -> Groceries: 75.00%, Petrol: 25.00%
    const breakdownRes = await request(app)
      .get('/api/v1/finance/category-breakdown?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(breakdownRes.status).toBe(200);
    const expenses = breakdownRes.body.data.expenses;
    expect(expenses.total).toBe('10000.00');
    expect(expenses.breakdown.length).toBe(2);

    const groceries = expenses.breakdown.find((c: any) => c.name === 'Groceries');
    expect(groceries.total).toBe('7500.00');
    expect(groceries.percentage).toBe('75.00');

    const fuel = expenses.breakdown.find((c: any) => c.name === 'Petrol & Fuel');
    expect(fuel.total).toBe('2500.00');
    expect(fuel.percentage).toBe('25.00');
  });

  it('returns timeline trends for charting', async () => {
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '1500.00',
        description: 'Shopping',
        categoryId: 'cat_shopping',
        transactionDate: '2026-10-08T15:00:00.000Z',
      });

    const trendsRes = await request(app)
      .get('/api/v1/finance/trends?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(trendsRes.status).toBe(200);
    expect(trendsRes.body.data.timeline.length).toBe(31);
    const oct8 = trendsRes.body.data.timeline.find((t: any) => t.date === '2026-10-08');
    expect(oct8).toBeDefined();
    expect(oct8.expense).toBe('1500.00');
    expect(oct8.income).toBe('0.00');
  });

  it('calculates previous period changes safely without dividing by zero', async () => {
    // Current period (October): 5000 expense
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '5000.00',
        description: 'New Laptop Stand',
        categoryId: 'cat_shopping',
        transactionDate: '2026-10-15T12:00:00.000Z',
      });

    const summaryRes = await request(app)
      .get('/api/v1/finance/summary?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
      .set('Authorization', `Bearer ${userToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.changes).toBeDefined();
    // Previous was 0, so change percentage is 0 (safe handling, no Infinity or NaN)
    expect(summaryRes.body.data.changes.expensePercentage).toBe(0);
    expect(summaryRes.body.data.changes.incomePercentage).toBe(0);
  });

  it('supports monthly grouping for multi-month trend queries', async () => {
    const trendsRes = await request(app)
      .get('/api/v1/finance/trends?startDate=2026-05-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z&groupBy=month')
      .set('Authorization', `Bearer ${userToken}`);

    expect(trendsRes.status).toBe(200);
    expect(trendsRes.body.data.groupBy).toBe('month');
    expect(trendsRes.body.data.timeline.length).toBe(6); // 6 months: May to Oct
    expect(trendsRes.body.data.timeline[0].label).toContain('May');
    expect(trendsRes.body.data.timeline[5].label).toContain('Oct');
  });
});
