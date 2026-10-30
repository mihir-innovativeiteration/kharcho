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
import { BudgetService } from '../../src/services/budget.service.js';

describe('Budget Alerts & Threshold Evaluation API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-alert-1';
  const otherUserId = 'user-alert-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Alert', email: 'alice@alert.com', budgetAlertsEnabled: true },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Alert', email: 'bob@alert.com', budgetAlertsEnabled: true },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@alert.com', name: 'Alice Alert' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@alert.com', name: 'Bob Alert' });
  });

  it('triggers persistent 50% and 80% threshold alerts when spending increases', async () => {
    // 1. Create a budget of 10,000 INR for Fuel with thresholds 50, 80, 100
    const bRes = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Fuel Budget',
        type: 'CATEGORY',
        categoryId: 'cat_petrol_fuel',
        amount: '10000.00',
        warningThresholds: [50, 80, 100],
      });
    expect(bRes.status).toBe(201);
    const budgetId = bRes.body.data.id;

    // 2. Add an expense of 5,500.00 (55% utilization -> should trigger 50% alert)
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '5500.00',
        description: 'Petrol pump',
        categoryId: 'cat_petrol_fuel',
        transactionDate: new Date().toISOString(),
      });

    // Evaluate budgets
    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);

    // 3. Query in-app alerts
    const alertsRes1 = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(alertsRes1.status).toBe(200);
    expect(alertsRes1.body.data.length).toBe(1);
    expect(alertsRes1.body.data[0].budgetId).toBe(budgetId);
    expect(alertsRes1.body.data[0].thresholdPercent).toBe(50);
    expect(alertsRes1.body.data[0].isRead).toBe(false);
    expect(alertsRes1.body.unreadCount).toBe(1);

    // 4. Add another expense of 3,000.00 (Total 8,500.00 = 85% -> should trigger 80% alert)
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '3000.00',
        description: 'Highway diesel',
        categoryId: 'cat_petrol_fuel',
        transactionDate: new Date().toISOString(),
      });

    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);

    const alertsRes2 = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(alertsRes2.status).toBe(200);
    expect(alertsRes2.body.data.length).toBe(2);
    const thresholds = alertsRes2.body.data.map((a: any) => a.thresholdPercent);
    expect(thresholds).toContain(50);
    expect(thresholds).toContain(80);
  });

  it('handles multi-threshold jump (e.g. crossing 50%, 80%, and 100% in a single transaction)', async () => {
    // Budget: 10,000.00
    await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Dining Budget',
        type: 'CATEGORY',
        categoryId: 'cat_food_dining',
        amount: '10000.00',
        warningThresholds: [50, 80, 100],
      });

    // Single large expense: 12,000.00 (120% utilization)
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '12000.00',
        description: 'Luxury party dinner',
        categoryId: 'cat_food_dining',
        transactionDate: new Date().toISOString(),
      });

    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);

    const res = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // Crossed all 3 thresholds: 50, 80, 100
    expect(res.body.data.length).toBe(3);
    const thresholds = res.body.data.map((a: any) => a.thresholdPercent);
    expect(thresholds).toContain(50);
    expect(thresholds).toContain(80);
    expect(thresholds).toContain(100);
  });

  it('never creates duplicate alerts on repeated evaluation (idempotent)', async () => {
    await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Bills Budget',
        type: 'CATEGORY',
        categoryId: 'cat_bills',
        amount: '10000.00',
        warningThresholds: [50, 80, 100],
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '6000.00',
        description: 'Electricity bill',
        categoryId: 'cat_bills',
        transactionDate: new Date().toISOString(),
      });

    // Run evaluation multiple times
    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);
    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);
    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);

    const res = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);

    // Exactly 1 alert for threshold 50, not 3
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].thresholdPercent).toBe(50);
  });

  it('marks a single alert as read and marks all alerts as read', async () => {
    await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Entertainment',
        type: 'CATEGORY',
        categoryId: 'cat_entertainment',
        amount: '5000.00',
        warningThresholds: [50, 80],
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '4500.00',
        description: 'Concert tickets',
        categoryId: 'cat_entertainment',
        transactionDate: new Date().toISOString(),
      });

    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);

    const listRes = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listRes.body.data.length).toBe(2);
    const alertId = listRes.body.data[0].id;

    // 1. Mark single alert as read
    const readRes = await request(app)
      .patch(`/api/v1/budget-alerts/${alertId}/read`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.isRead).toBe(true);

    // 2. Mark all alerts as read
    const markAllRes = await request(app)
      .patch('/api/v1/budget-alerts/read-all')
      .set('Authorization', `Bearer ${userToken}`);
    expect(markAllRes.status).toBe(200);

    // 3. Verify unreadCount is now 0
    const finalRes = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);
    expect(finalRes.body.unreadCount).toBe(0);
  });

  it('prevents cross-user alert access', async () => {
    // Create an alert for Alice
    await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Secret Budget',
        type: 'OVERALL',
        amount: '1000.00',
        warningThresholds: [50],
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'EXPENSE',
        amount: '800.00',
        description: 'Shopping',
        categoryId: 'cat_shopping',
        transactionDate: new Date().toISOString(),
      });

    await BudgetService.evaluateAllBudgetsForUser(userId, new Date(), mockPrisma);

    const aliceAlerts = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${userToken}`);
    const alertId = aliceAlerts.body.data[0].id;

    // Bob tries to mark Alice's alert as read
    const bobRes = await request(app)
      .patch(`/api/v1/budget-alerts/${alertId}/read`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(bobRes.status).toBe(404);

    // Bob list alerts should be empty
    const bobList = await request(app)
      .get('/api/v1/budget-alerts')
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(bobList.body.data.length).toBe(0);
  });
});
