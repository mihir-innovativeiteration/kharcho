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

describe('Recurring Bills, EMIs, Subscriptions & Reminders API', () => {
  let userToken: string;
  let otherUserToken: string;
  const userId = 'user-recurring-1';
  const otherUserId = 'user-recurring-2';

  beforeEach(async () => {
    mockPrisma.clear();
    await seedDefaults(mockPrisma);

    await mockPrisma.user.create({
      data: { id: userId, name: 'Alice Recurring', email: 'alice@recurring.com' },
    });
    await mockPrisma.user.create({
      data: { id: otherUserId, name: 'Bob Recurring', email: 'bob@recurring.com' },
    });

    userToken = generateAccessToken({ sub: userId, email: 'alice@recurring.com', name: 'Alice Recurring' });
    otherUserToken = generateAccessToken({ sub: otherUserId, email: 'bob@recurring.com', name: 'Bob Recurring' });
  });

  describe('Recurring Rules CRUD & Projections', () => {
    it('creates a monthly recurring expense rule and automatically creates the initial occurrence', async () => {
      const res = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Apartment Rent',
          providerName: 'Landlord Sharma',
          type: 'EXPENSE',
          amount: '25000.00',
          currency: 'INR',
          frequency: 'MONTHLY',
          interval: 1,
          startDate: '2026-11-01T00:00:00.000Z',
          reminderEnabled: true,
          reminderDaysBefore: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Apartment Rent');
      expect(res.body.data.amount).toBe('25000.00');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.nextDueAt).toBeDefined();

      // Verify initial occurrence was automatically generated
      const occRes = await request(app)
        .get('/api/v1/recurring-occurrences')
        .set('Authorization', `Bearer ${userToken}`);

      expect(occRes.status).toBe(200);
      expect(occRes.body.data.length).toBe(1);
      expect(occRes.body.data[0].recurringRuleId).toBe(res.body.data.id);
      expect(occRes.body.data[0].status).toBe('UPCOMING');
    });

    it('creates a recurring income rule (Monthly Salary)', async () => {
      const res = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'TechCorp Salary',
          providerName: 'TechCorp India Pvt Ltd',
          type: 'INCOME',
          amount: '95000.00',
          currency: 'INR',
          frequency: 'MONTHLY',
          interval: 1,
          startDate: '2026-11-01T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('TechCorp Salary');
      expect(res.body.data.type).toBe('INCOME');
    });

    it('lists rules with estimated monthly projected totals', async () => {
      // 1. Rent ₹25,000 monthly
      await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Rent',
          type: 'EXPENSE',
          amount: '25000.00',
          frequency: 'MONTHLY',
          startDate: '2026-11-01T00:00:00.000Z',
        });

      // 2. Netflix ₹649 monthly
      await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Netflix Premium',
          type: 'EXPENSE',
          amount: '649.00',
          frequency: 'MONTHLY',
          startDate: '2026-11-05T00:00:00.000Z',
        });

      // 3. Salary ₹95,000 monthly
      await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Salary',
          type: 'INCOME',
          amount: '95000.00',
          frequency: 'MONTHLY',
          startDate: '2026-11-01T00:00:00.000Z',
        });

      const listRes = await request(app)
        .get('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.length).toBe(3);
      expect(listRes.body.estimates.projectedMonthlyExpense).toBe('25649.00');
      expect(listRes.body.estimates.projectedMonthlyIncome).toBe('95000.00');
      expect(listRes.body.estimates.projectedMonthlyNet).toBe('69351.00');
    });

    it('pauses, resumes, and cancels a recurring rule', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Gym Membership',
          type: 'EXPENSE',
          amount: '2500.00',
          frequency: 'MONTHLY',
          startDate: '2026-11-01T00:00:00.000Z',
        });

      const ruleId = createRes.body.data.id;

      // Pause
      const pauseRes = await request(app)
        .patch(`/api/v1/recurring-rules/${ruleId}/pause`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe('PAUSED');

      // Resume
      const resumeRes = await request(app)
        .patch(`/api/v1/recurring-rules/${ruleId}/resume`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe('ACTIVE');

      // Cancel
      const cancelRes = await request(app)
        .patch(`/api/v1/recurring-rules/${ruleId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });
  });

  describe('Idempotent Payment Confirmation & Ledger Integrity', () => {
    it('confirms payment of an occurrence, creates a ledger transaction, and advances nextDueAt', async () => {
      // Create Rent rule
      const ruleRes = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'House Rent',
          type: 'EXPENSE',
          amount: '20000.00',
          frequency: 'MONTHLY',
          startDate: '2026-11-01T00:00:00.000Z',
        });

      const ruleId = ruleRes.body.data.id;

      // Get occurrence
      const occList = await request(app)
        .get(`/api/v1/recurring-occurrences?recurringRuleId=${ruleId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(occList.body.data.length).toBe(1);
      const occurrenceId = occList.body.data[0].id;
      expect(occList.body.data[0].status).toBe('UPCOMING');

      // Check transactions count before confirmation
      expect(mockPrisma.transactions.length).toBe(0);

      // Confirm payment
      const confirmRes = await request(app)
        .post(`/api/v1/recurring-occurrences/${occurrenceId}/confirm-paid`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paidAt: '2026-11-01T10:00:00.000Z',
          notes: 'Paid via UPI to landlord',
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.data.occurrence.status).toBe('PAID');
      expect(confirmRes.body.data.transaction).toBeDefined();
      expect(confirmRes.body.data.transaction.amount.toString()).toBe('20000');
      expect(confirmRes.body.data.alreadyPaid).toBe(false);

      // Exactly 1 transaction created
      expect(mockPrisma.transactions.length).toBe(1);

      // Next due date was advanced on rule
      const updatedRule = await mockPrisma.recurringRule.findUnique({ where: { id: ruleId } });
      expect(updatedRule?.nextDueAt.toISOString()).toBe('2026-12-01T00:00:00.000Z');

      // Next occurrence was automatically generated
      const nextOccurrences = await mockPrisma.recurringOccurrence.findMany({
        where: { recurringRuleId: ruleId },
      });
      expect(nextOccurrences.length).toBe(2);
      expect(nextOccurrences.some((o: any) => o.status === 'PAID')).toBe(true);
      expect(nextOccurrences.some((o: any) => o.status === 'UPCOMING')).toBe(true);

      // IDEMPOTENCY TEST: Call confirm-paid again for the same occurrence
      const duplicateRes = await request(app)
        .post(`/api/v1/recurring-occurrences/${occurrenceId}/confirm-paid`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paidAt: '2026-11-01T10:00:00.000Z',
        });

      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.body.success).toBe(true);
      expect(duplicateRes.body.data.alreadyPaid).toBe(true);

      // No second transaction was created!
      expect(mockPrisma.transactions.length).toBe(1);
    });

    it('skips an occurrence without creating a transaction and advances nextDueAt', async () => {
      const ruleRes = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Annual Newspaper Sub',
          type: 'EXPENSE',
          amount: '1200.00',
          frequency: 'YEARLY',
          startDate: '2026-11-01T00:00:00.000Z',
        });

      const ruleId = ruleRes.body.data.id;
      const occList = await request(app)
        .get(`/api/v1/recurring-occurrences?recurringRuleId=${ruleId}`)
        .set('Authorization', `Bearer ${userToken}`);

      const occurrenceId = occList.body.data[0].id;

      const skipRes = await request(app)
        .post(`/api/v1/recurring-occurrences/${occurrenceId}/skip`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(skipRes.status).toBe(200);
      expect(skipRes.body.success).toBe(true);
      expect(skipRes.body.data.status).toBe('SKIPPED');

      // No transaction created
      expect(mockPrisma.transactions.length).toBe(0);

      // Rule nextDueAt was advanced to 2027
      const updatedRule = await mockPrisma.recurringRule.findUnique({ where: { id: ruleId } });
      expect(updatedRule?.nextDueAt.toISOString()).toBe('2027-11-01T00:00:00.000Z');
    });
  });

  describe('Reminders & Background Scheduler', () => {
    it('scheduler tick generates reminders within notification lead window', async () => {
      // Create a bill due in 2 days with reminderDaysBefore: 3
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 2);

      await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Electricity Bill - Torrent Power',
          type: 'EXPENSE',
          amount: '3450.00',
          frequency: 'MONTHLY',
          startDate: dueDate.toISOString(),
          reminderEnabled: true,
          reminderDaysBefore: 3,
        });

      // Run scheduler tick
      const tickRes = await request(app).post('/api/v1/recurring/scheduler-tick');
      expect(tickRes.status).toBe(200);
      expect(tickRes.body.success).toBe(true);
      expect(tickRes.body.remindersCreated).toBeGreaterThanOrEqual(1);

      // Fetch user reminders
      const remRes = await request(app)
        .get('/api/v1/reminders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(remRes.status).toBe(200);
      expect(remRes.body.data.length).toBeGreaterThanOrEqual(1);
      const reminder = remRes.body.data[0];
      expect(reminder.title).toContain('Electricity Bill');
      expect(reminder.isRead).toBe(false);

      // Mark reminder as read
      const readRes = await request(app)
        .patch(`/api/v1/reminders/${reminder.id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.isRead).toBe(true);
    });
  });

  describe('Multi-tenant Security & IDOR Isolation', () => {
    it('prevents user B from viewing, updating, or confirming user A recurring rules', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring-rules')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Secret Loan Payment',
          type: 'EXPENSE',
          amount: '50000.00',
          frequency: 'MONTHLY',
          startDate: '2026-11-01T00:00:00.000Z',
        });

      const ruleId = createRes.body.data.id;

      // User B tries to get User A's rule -> 404
      const getRes = await request(app)
        .get(`/api/v1/recurring-rules/${ruleId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(getRes.status).toBe(404);

      // User B tries to pause User A's rule -> 404
      const pauseRes = await request(app)
        .patch(`/api/v1/recurring-rules/${ruleId}/pause`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(pauseRes.status).toBe(404);

      // User B tries to delete User A's rule -> 404
      const delRes = await request(app)
        .delete(`/api/v1/recurring-rules/${ruleId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(delRes.status).toBe(404);
    });
  });
});
