const request = require('supertest');
const app = require('../src/index');

describe('Check-out and Check-in Lifecycle', () => {
  let adminToken;
  let availableAssetId;
  let retiredAssetId;

  beforeAll(async () => {
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'admin123' });
    adminToken = loginRes.body.data.token;

    // Fetch assets to find an available one and a retired one
    const assetsRes = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`);

    const assets = assetsRes.body.data;
    const available = assets.find((a) => a.status === 'Available');
    const retired = assets.find((a) => a.status === 'Retired');

    if (available) availableAssetId = available.id;
    if (retired) retiredAssetId = retired.id;
  });

  test('POST /api/checkout successfully checks out an available asset', async () => {
    if (!availableAssetId) return;

    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId: availableAssetId,
        purpose: 'Testing automation checkout flow',
        expectedReturn: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CheckedOut');

    // Clean up / check in to leave asset available for other tests
    const checkinRes = await request(app)
      .post(`/api/checkout/${res.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        conditionOnReturn: 'Good',
      });

    expect(checkinRes.statusCode).toBe(200);
    expect(checkinRes.body.success).toBe(true);
    expect(checkinRes.body.data.status).toBe('Returned');
  });

  test('POST /api/checkout fails when attempting to check out a retired asset', async () => {
    if (!retiredAssetId) return;

    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId: retiredAssetId,
        purpose: 'Illegal checkout attempt',
        expectedReturn: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

