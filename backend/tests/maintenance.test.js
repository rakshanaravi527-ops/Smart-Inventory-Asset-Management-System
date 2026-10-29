const request = require('supertest');
const app = require('../src/index');

describe('Maintenance Schedules and Alert Logic', () => {
  let adminToken;
  let testAssetId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'admin123' });
    adminToken = loginRes.body.data.token;

    const assetsRes = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`);

    if (assetsRes.body.data && assetsRes.body.data.length > 0) {
      testAssetId = assetsRes.body.data[0].id;
    }
  });

  test('GET /api/maintenance/upcoming returns upcoming items', async () => {
    const res = await request(app)
      .get('/api/maintenance/upcoming')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.upcoming)).toBe(true);
    expect(Array.isArray(res.body.data.overdue)).toBe(true);
  });

  test('POST /api/maintenance/schedules creates a new schedule', async () => {
    if (!testAssetId) return;

    const res = await request(app)
      .post('/api/maintenance/schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId: testAssetId,
        type: 'maintenance',
        intervalDays: 90,
        alertDaysBefore: 14,
        nextDueDate: new Date(Date.now() + 864000000).toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.intervalDays).toBe(90);
  });
});

