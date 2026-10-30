import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../setup/mockPrisma.js';

vi.mock('../../src/config/db.js', () => ({
  prisma: mockPrisma,
}));

const { createApp } = await import('../../src/app.js');
const app = createApp();
import { generateAccessToken } from '../../src/utils/jwt.js';
import { PushNotificationService } from '../../src/services/pushNotification.service.js';

describe('Notifications & Device Token API', () => {
  let userToken: string;
  const userId = 'user-notif-1';

  beforeEach(async () => {
    mockPrisma.clear();

    await mockPrisma.user.create({
      data: {
        id: userId,
        name: 'Notif Tester',
        email: 'notif@example.com',
        budgetAlertsEnabled: true,
        billRemindersEnabled: true,
        savingsMilestonesEnabled: true,
        syncAlertsEnabled: true,
        dailySummaryEnabled: false,
      },
    });

    userToken = generateAccessToken({ sub: userId, email: 'notif@example.com', name: 'Notif Tester' });
  });

  it('registers an Expo push token successfully', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/device-token')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        platform: 'android',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');

    const tokens = await mockPrisma.devicePushToken.findMany({ where: { userId } });
    expect(tokens.length).toBe(1);
    expect(tokens[0].platform).toBe('android');
  });

  it('unregisters a device push token on logout', async () => {
    const token = 'ExponentPushToken[to-unregister-12345]';
    await mockPrisma.devicePushToken.upsert({
      where: { token },
      create: { userId, token, platform: 'ios', isActive: true },
      update: {},
    });

    const res = await request(app)
      .delete('/api/v1/notifications/device-token')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const tokens = await mockPrisma.devicePushToken.findMany({ where: { userId } });
    expect(tokens.length).toBe(0);
  });

  it('fetches and updates user notification preferences', async () => {
    // 1. Fetch preferences
    const getRes = await request(app)
      .get('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.budgetAlertsEnabled).toBe(true);
    expect(getRes.body.data.dailySummaryEnabled).toBe(false);

    // 2. Update preferences
    const patchRes = await request(app)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dailySummaryEnabled: true,
        budgetAlertsEnabled: false,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.dailySummaryEnabled).toBe(true);
    expect(patchRes.body.data.budgetAlertsEnabled).toBe(false);
  });

  it('respects notification preferences and skips delivery if category is disabled', async () => {
    // User disabled budget alerts
    await mockPrisma.user.update({
      where: { id: userId },
      data: { budgetAlertsEnabled: false },
    });

    await mockPrisma.devicePushToken.upsert({
      where: { token: 'ExponentPushToken[active-test-1]' },
      create: { userId, token: 'ExponentPushToken[active-test-1]', platform: 'android', isActive: true },
      update: {},
    });

    const result = await PushNotificationService.sendPushNotification(
      userId,
      {
        title: 'Budget Alert',
        body: 'You reached 80% of dining budget',
        category: 'budget',
      },
      mockPrisma
    );

    expect(result.sent).toBe(0);
    expect(result.reason).toBe('PREFERENCE_DISABLED');
  });
});
