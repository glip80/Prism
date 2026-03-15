import request from 'supertest';
import app from '../../app';

// Mock the database and auth middleware for integration tests
jest.mock('../../database/mongo', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../shared/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', email: 'test@example.com', roles: ['admin'] };
    next();
  },
}));
jest.mock('../../../../shared/middleware/rbac', () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../models/layout');

describe('Layout API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('Layout');
    });
  });

  describe('GET /layouts', () => {
    it('should return a list of layouts', async () => {
      const LayoutModel = require('../../models/layout').LayoutModel;
      LayoutModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { id: '1', title: 'Test Layout', version: 1 },
        ]),
      });

      const res = await request(app).get('/layouts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /layouts', () => {
    it('should create a new layout', async () => {
      const LayoutModel = require('../../models/layout').LayoutModel;
      const mockSave = jest.fn().mockResolvedValue({
        id: 'new-uuid',
        title: 'New Layout',
        version: 1,
        widgets: [],
        toJSON: () => ({ id: 'new-uuid', title: 'New Layout', version: 1 }),
      });
      LayoutModel.mockImplementation(() => ({ save: mockSave }));

      jest.mock('../../services/versioningService', () => ({
        versioningService: { saveSnapshot: jest.fn().mockResolvedValue({}) },
      }));

      const res = await request(app)
        .post('/layouts')
        .send({ title: 'New Layout', widgets: [] });

      expect(res.status).toBe(201);
    });
  });
});
