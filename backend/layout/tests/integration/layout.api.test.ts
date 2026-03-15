import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDB, teardownTestDB } from '../utils/test-db';

describe('Layout API Integration', () => {
  let app: any;
  let authToken: string;
  let testLayoutId: string;

  beforeAll(async () => {
    await setupTestDB();
    app = createApp();

    // Get auth token
    const loginRes = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'testpass' });

    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/v1/layouts', () => {
    it('should create a new layout', async () => {
      const layoutData = {
        title: 'Test Dashboard',
        description: 'Integration test layout',
        layout_config: {
          breakpoints: { lg: 1200, md: 996 },
          cols: { lg: 12, md: 10 },
          rowHeight: 100,
          margin: [10, 10],
        },
        widgets: [
          {
            id: 'widget-1',
            type: 'metric',
            title: 'Test Metric',
            x: 0,
            y: 0,
            w: 4,
            h: 2,
            config: {
              dataSource: {
                connector_id: 'conn-123',
                query: 'SELECT count(*) FROM users',
                refreshInterval: 60000,
              },
            },
          },
        ],
      };

      const response = await supertest(app)
        .post('/api/v1/layouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(layoutData)
        .expect(201);

      testLayoutId = response.body.id;
      expect(response.body.title).toBe(layoutData.title);
      expect(response.body.widgets).toHaveLength(1);
    });
  });

  describe('GET /api/v1/layouts/:id', () => {
    it('should retrieve layout with caching', async () => {
      // First request - cache miss
      const res1 = await supertest(app)
        .get(`/api/v1/layouts/${testLayoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res1.headers['x-cache']).toBe('MISS');

      // Second request - cache hit
      const res2 = await supertest(app)
        .get(`/api/v1/layouts/${testLayoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res2.headers['x-cache']).toBe('HIT');
    });
  });

  describe('Layout Versioning', () => {
    it('should create version on update', async () => {
      const update = {
        title: 'Updated Dashboard',
        changeSummary: 'Updated title',
      };

      const res = await supertest(app)
        .put(`/api/v1/layouts/${testLayoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(200);

      expect(res.body.version).toBe(2);

      // Check version exists
      const versions = await supertest(app)
        .get(`/api/v1/layouts/${testLayoutId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(versions.body).toHaveLength(2);
    });
  });
});
