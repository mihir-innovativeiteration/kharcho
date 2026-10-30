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

describe('Savings Goals & Contribution Ledger API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-savings-1';
  const otherUserId = 'user-savings-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Saver', email: 'alice@saver.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Saver', email: 'bob@saver.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@saver.com', name: 'Alice Saver' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@saver.com', name: 'Bob Saver' });
  });

  it('creates a savings goal with initial 0% progress and non-bank transfer disclaimer', async () => {
    const res = await request(app)
      .post('/api/v1/savings-goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Emergency Fund',
        description: '6 months of living expenses',
        targetAmount: '150000.00',
        targetDate: '2027-12-31T23:59:59.999Z',
        icon: 'Shield',
        color: '#10B981',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Emergency Fund');
    expect(res.body.data.targetAmount).toBe('150000.00');
    expect(res.body.data.totalSaved).toBe('0.00');
    expect(res.body.data.remainingAmount).toBe('150000.00');
    expect(res.body.data.completionPercentage).toBe(0);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.disclaimer).toMatch(/manual tracking entries/i);
  });

  it('records contributions in the ledger, recalculates progress and updates status to COMPLETED', async () => {
    // 1. Create goal: 50,000 INR
    const goalRes = await request(app)
      .post('/api/v1/savings-goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Goa Vacation',
        targetAmount: '50000.00',
      });
    const goalId = goalRes.body.data.id;

    // 2. Add first contribution: 20,000.00
    const c1Res = await request(app)
      .post(`/api/v1/savings-goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: '20000.00',
        note: 'October bonus',
      });

    expect(c1Res.status).toBe(201);
    expect(c1Res.body.data.contribution.amount).toBe('20000.00');
    expect(c1Res.body.data.goal.totalSaved).toBe('20000.00');
    expect(c1Res.body.data.goal.remainingAmount).toBe('30000.00');
    expect(c1Res.body.data.goal.completionPercentage).toBe(40.0);
    expect(c1Res.body.data.goal.status).toBe('ACTIVE');

    // 3. Add second contribution reaching target: 30,000.00 (Total = 50,000.00)
    const c2Res = await request(app)
      .post(`/api/v1/savings-goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: '30000.00',
        note: 'Savings from salary',
      });

    expect(c2Res.status).toBe(201);
    expect(c2Res.body.data.goal.totalSaved).toBe('50000.00');
    expect(c2Res.body.data.goal.remainingAmount).toBe('0.00');
    expect(c2Res.body.data.goal.completionPercentage).toBe(100.0);
    expect(c2Res.body.data.goal.status).toBe('COMPLETED');
    expect(c2Res.body.data.goal.isCompleted).toBe(true);

    // 4. List contributions
    const listRes = await request(app)
      .get(`/api/v1/savings-goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(2);
  });

  it('reverses / deletes a contribution and restores goal status to ACTIVE', async () => {
    // 1. Goal: 10,000 INR
    const goalRes = await request(app)
      .post('/api/v1/savings-goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'New Bike Helmet',
        targetAmount: '10000.00',
      });
    const goalId = goalRes.body.data.id;

    // 2. Add contribution that completes it: 10,000.00
    const cRes = await request(app)
      .post(`/api/v1/savings-goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: '10000.00',
      });
    expect(cRes.body.data.goal.status).toBe('COMPLETED');
    const contributionId = cRes.body.data.contribution.id;

    // 3. Reverse the contribution
    const revRes = await request(app)
      .delete(`/api/v1/savings-goals/${goalId}/contributions/${contributionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(revRes.status).toBe(200);
    expect(revRes.body.data.goal.totalSaved).toBe('0.00');
    expect(revRes.body.data.goal.remainingAmount).toBe('10000.00');
    expect(revRes.body.data.goal.completionPercentage).toBe(0.0);
    expect(revRes.body.data.goal.status).toBe('ACTIVE');
  });

  it('prevents cross-user IDOR access on savings goals and contributions', async () => {
    const goalRes = await request(app)
      .post('/api/v1/savings-goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Private Goal',
        targetAmount: '100000.00',
      });
    const goalId = goalRes.body.data.id;

    // Bob cannot read Alice's goal
    const readRes = await request(app)
      .get(`/api/v1/savings-goals/${goalId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(readRes.status).toBe(404);

    // Bob cannot contribute to Alice's goal
    const cRes = await request(app)
      .post(`/api/v1/savings-goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ amount: '500.00' });
    expect(cRes.status).toBe(404);

    // Bob cannot delete Alice's goal
    const delRes = await request(app)
      .delete(`/api/v1/savings-goals/${goalId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(delRes.status).toBe(404);
  });
});
