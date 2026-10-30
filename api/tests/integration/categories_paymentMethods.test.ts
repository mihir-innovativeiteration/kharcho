import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../setup/mockPrisma.js';

// Mock database connection before importing app
vi.mock('../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

const { createApp } = await import('../../src/app.js');
const app = createApp();
import { generateAccessToken } from '../../src/utils/jwt.js';
import { seedDefaults } from '../../src/services/seed.service.js';

describe('Categories & Payment Methods API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-test-1';
  const otherUserId = 'user-test-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    // Create test users
    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Test', email: 'alice@example.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Test', email: 'bob@example.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@example.com', name: 'Alice Test' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@example.com', name: 'Bob Test' });
  });

  it('lists default system categories', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(19);
    const groceries = res.body.data.find((c: any) => c.name === 'Groceries');
    expect(groceries).toBeDefined();
    expect(groceries.isSystem).toBe(true);
    expect(groceries.type).toBe('EXPENSE');
  });

  it('allows user to create a custom category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Gym & Fitness',
        type: 'EXPENSE',
        icon: 'Dumbbell',
        color: '#10B981',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Gym & Fitness');
    expect(res.body.data.isSystem).toBe(false);
    expect(res.body.data.userId).toBe(userId);
  });

  it('prevents modifying or deleting system categories', async () => {
    // Attempt update on system category
    const updateRes = await request(app)
      .patch('/api/v1/categories/cat_food_dining')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacked Food' });

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.error).toContain('System categories cannot be modified');

    // Attempt delete on system category
    const deleteRes = await request(app)
      .delete('/api/v1/categories/cat_food_dining')
      .set('Authorization', `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.error).toContain('System categories cannot be deleted');
  });

  it('prevents user from modifying another user custom category', async () => {
    // User A creates category
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Side Hustle',
        type: 'INCOME',
        icon: 'Sparkles',
      });

    const categoryId = createRes.body.data.id;

    // User B attempts to edit User A category
    const hackRes = await request(app)
      .patch(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ name: 'Bob Stole This' });

    expect(hackRes.status).toBe(404);
  });

  it('lists default system payment methods', async () => {
    const res = await request(app)
      .get('/api/v1/payment-methods')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const upi = res.body.data.find((pm: any) => pm.name === 'UPI');
    expect(upi).toBeDefined();
    expect(upi.type).toBe('UPI');
    expect(upi.isSystem).toBe(true);
  });

  it('allows user to create a custom payment method', async () => {
    const res = await request(app)
      .post('/api/v1/payment-methods')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'HDFC Salary Account',
        type: 'BANK_TRANSFER',
        details: 'Account ending in 4591',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('HDFC Salary Account');
    expect(res.body.data.isSystem).toBe(false);
  });

  it('prevents modifying or deleting system payment methods', async () => {
    const updateRes = await request(app)
      .patch('/api/v1/payment-methods/pm_cash')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacked Cash' });

    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete('/api/v1/payment-methods/pm_cash')
      .set('Authorization', `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(403);
  });
});
